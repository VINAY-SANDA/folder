import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertFoodListingSchema, insertMessageSchema, insertTransactionSchema, insertReviewSchema } from "@shared/schema";
import { foodListings } from "@shared/schema";
import { z } from "zod";

// Helper function to parse and validate with zod
const validateBody = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: () => void) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  };
};

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - Please log in" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Food Listings Routes
  app.get("/api/food-listings", async (req, res) => {
    try {
      // Check for location-based search
      if (req.query.lat && req.query.lng && req.query.radius) {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radius = parseFloat(req.query.radius as string);
        
        if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
          return res.status(400).json({ message: "Invalid location parameters" });
        }
        
        const listings = await storage.getFoodListingsByLocation(lat, lng, radius);
        return res.json(listings);
      }
      
      // Get all listings if no location params
      const listings = await storage.getAllFoodListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching food listings" });
    }
  });

  app.get("/api/food-listings/:id", async (req, res) => {
    try {
      const listing = await storage.getFoodListing(parseInt(req.params.id));
      if (!listing) {
        return res.status(404).json({ message: "Food listing not found" });
      }
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Error fetching food listing" });
    }
  });

  app.post("/api/food-listings", isAuthenticated, validateBody(insertFoodListingSchema), async (req, res) => {
    try {
      const userId = req.user!.id;
      const listing = await storage.createFoodListing({
        ...req.body,
        userId
      });
      res.status(201).json(listing);
    } catch (error) {
      res.status(500).json({ message: "Error creating food listing" });
    }
  });

  app.put("/api/food-listings/:id", isAuthenticated, async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getFoodListing(listingId);
      
      if (!listing) {
        return res.status(404).json({ message: "Food listing not found" });
      }
      
      // Check if user owns the listing
      if (listing.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this listing" });
      }
      
      const updatedListing = await storage.updateFoodListing(listingId, req.body);
      res.json(updatedListing);
    } catch (error) {
      res.status(500).json({ message: "Error updating food listing" });
    }
  });

  app.delete("/api/food-listings/:id", isAuthenticated, async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getFoodListing(listingId);
      
      if (!listing) {
        return res.status(404).json({ message: "Food listing not found" });
      }
      
      // Check if user owns the listing
      if (listing.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this listing" });
      }
      
      await storage.deleteFoodListing(listingId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting food listing" });
    }
  });

  // User listings
  app.get("/api/users/:userId/food-listings", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const listings = await storage.getFoodListingsByUser(userId);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user listings" });
    }
  });

  // Messages Routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const messages = await storage.getMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);
      const conversation = await storage.getConversation(currentUserId, otherUserId);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching conversation" });
    }
  });

  app.post("/api/messages", isAuthenticated, validateBody(insertMessageSchema), async (req, res) => {
    try {
      const senderId = req.user!.id;
      const message = await storage.createMessage({
        ...req.body,
        senderId
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Error sending message" });
    }
  });

  app.put("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(messageId);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error marking message as read" });
    }
  });

  // Transaction Routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(parseInt(req.params.id));
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if user is part of the transaction
      const userId = req.user!.id;
      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this transaction" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction" });
    }
  });

  app.post("/api/transactions", isAuthenticated, validateBody(insertTransactionSchema), async (req, res) => {
    try {
      const buyerId = req.user!.id;
      const transaction = await storage.createTransaction({
        ...req.body,
        buyerId
      });
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error creating transaction" });
    }
  });

  app.put("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if user is part of the transaction
      const userId = req.user!.id;
      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this transaction" });
      }
      
      const updatedTransaction = await storage.updateTransaction(transactionId, req.body);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Error updating transaction" });
    }
  });

  // Review Routes
  app.get("/api/users/:userId/reviews", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  app.get("/api/food-listings/:listingId/reviews", async (req, res) => {
    try {
      const listingId = parseInt(req.params.listingId);
      const reviews = await storage.getReviewsByListing(listingId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  app.post("/api/reviews", isAuthenticated, validateBody(insertReviewSchema), async (req, res) => {
    try {
      const reviewerId = req.user!.id;
      const review = await storage.createReview({
        ...req.body,
        reviewerId
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: "Error creating review" });
    }
  });

  // User profile route
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.put("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Don't allow password updates through this endpoint
      const { password, ...updatableFields } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updatableFields);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
