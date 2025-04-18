import { users, foodListings, messages, transactions, reviews } from "@shared/schema";
import type { User, InsertUser, FoodListing, InsertFoodListing, Message, InsertMessage, Transaction, InsertTransaction, Review, InsertReview } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Food listing operations
  createFoodListing(listing: InsertFoodListing): Promise<FoodListing>;
  getFoodListing(id: number): Promise<FoodListing | undefined>;
  getFoodListingsByUser(userId: number): Promise<FoodListing[]>;
  getFoodListingsByLocation(lat: number, lng: number, radiusMiles: number): Promise<FoodListing[]>;
  updateFoodListing(id: number, listing: Partial<FoodListing>): Promise<FoodListing | undefined>;
  deleteFoodListing(id: number): Promise<boolean>;
  getAllFoodListings(): Promise<FoodListing[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  getReviewsByListing(listingId: number): Promise<Review[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private foodListings: Map<number, FoodListing>;
  private messages: Map<number, Message>;
  private transactions: Map<number, Transaction>;
  private reviews: Map<number, Review>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentFoodListingId: number;
  currentMessageId: number;
  currentTransactionId: number;
  currentReviewId: number;

  constructor() {
    this.users = new Map();
    this.foodListings = new Map();
    this.messages = new Map();
    this.transactions = new Map();
    this.reviews = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    this.currentUserId = 1;
    this.currentFoodListingId = 1;
    this.currentMessageId = 1;
    this.currentTransactionId = 1;
    this.currentReviewId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Food listing operations
  async createFoodListing(listing: InsertFoodListing): Promise<FoodListing> {
    const id = this.currentFoodListingId++;
    const createdAt = new Date();
    const isAvailable = true;
    const foodListing: FoodListing = { ...listing, id, createdAt, isAvailable };
    this.foodListings.set(id, foodListing);
    return foodListing;
  }

  async getFoodListing(id: number): Promise<FoodListing | undefined> {
    return this.foodListings.get(id);
  }

  async getFoodListingsByUser(userId: number): Promise<FoodListing[]> {
    return Array.from(this.foodListings.values()).filter(
      (listing) => listing.userId === userId
    );
  }

  async getFoodListingsByLocation(lat: number, lng: number, radiusMiles: number): Promise<FoodListing[]> {
    // Simple implementation - in a real app we would use proper geospatial queries
    return Array.from(this.foodListings.values()).filter(listing => {
      if (!listing.latitude || !listing.longitude) return false;
      
      // Approximate distance calculation (Haversine formula would be more accurate)
      const latDiff = Math.abs(listing.latitude - lat);
      const lngDiff = Math.abs(listing.longitude - lng);
      
      // Very simplified - 1 degree is roughly 69 miles for latitude
      const approxDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69;
      
      return approxDistance <= radiusMiles && listing.isAvailable;
    });
  }

  async updateFoodListing(id: number, listingData: Partial<FoodListing>): Promise<FoodListing | undefined> {
    const listing = this.foodListings.get(id);
    if (!listing) return undefined;
    
    const updatedListing = { ...listing, ...listingData };
    this.foodListings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteFoodListing(id: number): Promise<boolean> {
    return this.foodListings.delete(id);
  }

  async getAllFoodListings(): Promise<FoodListing[]> {
    return Array.from(this.foodListings.values());
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const isRead = false;
    const newMessage: Message = { ...message, id, createdAt, isRead };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;
    
    message.isRead = true;
    this.messages.set(id, message);
    return true;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const createdAt = new Date();
    const newTransaction: Transaction = { ...transaction, id, createdAt };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.buyerId === userId || transaction.sellerId === userId
    );
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const createdAt = new Date();
    const newReview: Review = { ...review, id, createdAt };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.receiverId === userId
    );
  }

  async getReviewsByListing(listingId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.listingId === listingId
    );
  }
}

export const storage = new MemStorage();
