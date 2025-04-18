import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  location: text("location").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  profileImage: true,
  location: true,
  latitude: true,
  longitude: true,
  bio: true,
});

// Food Listing Schema
export const foodListings = pgTable("food_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  images: text("images").array(),
  price: doublePrecision("price"),
  isFree: boolean("is_free").default(false),
  quantity: integer("quantity").notNull(),
  portionSize: text("portion_size"),
  category: text("category").notNull(),
  ingredients: text("ingredients"),
  allergens: text("allergens"),
  expiresAt: timestamp("expires_at").notNull(),
  location: text("location").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  userId: integer("user_id").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create the base schema and extend it to handle date format correctly
const baseFoodListingSchema = createInsertSchema(foodListings).pick({
  title: true,
  description: true,
  images: true,
  price: true,
  isFree: true,
  quantity: true,
  portionSize: true,
  category: true,
  ingredients: true,
  allergens: true,
  location: true,
  latitude: true,
  longitude: true,
  userId: true,
});

// Extended schema with custom validation for expiresAt field
export const insertFoodListingSchema = baseFoodListingSchema.extend({
  expiresAt: z.preprocess(
    // Convert string date to Date object
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
      }
      return arg;
    },
    z.date({
      required_error: "Expiration date is required",
      invalid_type_error: "Expiration date must be a valid date",
    })
  )
});

// Messages Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

// Transactions Schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  listingId: integer("listing_id").notNull(),
  status: text("status").notNull(), // pending, completed, cancelled
  amount: doublePrecision("amount"),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  buyerId: true,
  sellerId: true,
  listingId: true,
  status: true,
  amount: true,
  isPaid: true,
});

// Reviews Schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: integer("reviewer_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  listingId: integer("listing_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  reviewerId: true,
  receiverId: true,
  listingId: true,
  rating: true,
  comment: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FoodListing = typeof foodListings.$inferSelect;
export type InsertFoodListing = z.infer<typeof insertFoodListingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
