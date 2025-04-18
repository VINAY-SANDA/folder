import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FoodListing, User, InsertTransaction } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/lib/geolocation';
import { calculateDistance } from '@/lib/geolocation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Map } from '@/components/ui/map';
import { formatDistanceToNow } from 'date-fns';
import { Star, Clock, MapPin, MessageSquare, AlignLeft, AlertTriangle, ShieldCheck, Send } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const { latitude: userLat, longitude: userLng } = useGeolocation();
  
  const listingId = parseInt(id);

  // Fetch listing details
  const { data: listing, isLoading: isListingLoading } = useQuery<FoodListing>({
    queryKey: [`/api/food-listings/${listingId}`],
    enabled: !isNaN(listingId),
  });

  // Fetch seller details when listing is loaded
  const { data: seller, isLoading: isSellerLoading } = useQuery<User>({
    queryKey: [`/api/users/${listing?.userId}`],
    enabled: !!listing?.userId,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Order placed!",
        description: listing?.isFree 
          ? "You've successfully claimed this item. Contact the provider to arrange pickup." 
          : "You've successfully ordered this food. Contact the provider to arrange pickup or delivery.",
      });
      setLocation("/messages");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", message);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Your message has been sent to the food provider.",
      });
      setMessageContent('');
      setShowContactDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle order/claim button click
  const handleOrderClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in or create an account to order food",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    if (!listing || !seller) return;

    // Create transaction
    createTransactionMutation.mutate({
      buyerId: user.id,
      sellerId: seller.id,
      listingId: listing.id,
      status: 'pending',
      amount: listing.price || 0,
      isPaid: false,
    });
  };

  // Handle send message click
  const handleSendMessage = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in or create an account to contact the provider",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    if (!listing || !seller || !messageContent.trim()) return;

    sendMessageMutation.mutate({
      receiverId: seller.id,
      content: messageContent,
    });
  };

  // Format expiration time
  const formatExpiration = (date?: Date | string) => {
    if (!date) return 'No expiration set';
    return `Available until ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
  };

  // Calculate distance to listing
  const getDistance = () => {
    if (!userLat || !userLng || !listing?.latitude || !listing?.longitude) return null;
    return calculateDistance(userLat, userLng, listing.latitude, listing.longitude);
  };

  // Check if current user is the seller
  const isOwner = user && listing && user.id === listing.userId;

  return (
    <div className="container mx-auto px-4 py-8">
      {isListingLoading ? (
        // Loading skeleton
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="w-full h-[400px] rounded-lg" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div>
              <Skeleton className="h-[200px] w-full rounded-lg mb-6" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ) : listing ? (
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="text-neutral-600 hover:text-primary-600 p-0"
            >
              &larr; Back to listings
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Image */}
              <div className="rounded-lg overflow-hidden bg-neutral-100 h-[400px]">
                {listing.images && listing.images.length > 0 ? (
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-icons text-6xl text-neutral-400">restaurant</span>
                  </div>
                )}
              </div>
              
              {/* Additional Images */}
              {listing.images && listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1).map((img, index) => (
                    <img 
                      key={index}
                      src={img} 
                      alt={`${listing.title} ${index + 2}`} 
                      className="w-full h-24 object-cover rounded-lg" 
                    />
                  ))}
                </div>
              )}
              
              {/* Listing Title and Info */}
              <div>
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold">{listing.title}</h1>
                  <div className="flex items-center">
                    <Badge className={listing.isFree ? 'bg-blue-500' : 'bg-primary-500'}>
                      {listing.isFree ? 'Free' : `$${listing.price?.toFixed(2)}`}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center mt-2 text-neutral-600">
                  <div className="flex items-center mr-4">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span>4.8 (24 reviews)</span>
                  </div>
                  
                  <div className="flex items-center mr-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatExpiration(listing.expiresAt)}</span>
                  </div>
                  
                  {getDistance() !== null && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{getDistance()?.toFixed(1)} miles away</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tabs for Description and Details */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="description" className="flex items-center">
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="p-4 bg-white rounded-b-lg border border-t-0">
                  <p className="text-neutral-700">{listing.description}</p>
                  
                  {/* Food Quantity */}
                  <div className="mt-4">
                    <h3 className="font-medium text-lg">Quantity</h3>
                    <p className="text-neutral-600">
                      {listing.quantity} {listing.quantity > 1 ? 'portions' : 'portion'}
                      {listing.portionSize && ` (${listing.portionSize})`}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="p-4 bg-white rounded-b-lg border border-t-0">
                  {/* Ingredients */}
                  <div className="mb-4">
                    <h3 className="font-medium text-lg">Ingredients</h3>
                    <p className="text-neutral-600">
                      {listing.ingredients || 'No ingredient information provided'}
                    </p>
                  </div>
                  
                  {/* Allergens */}
                  <div className="mb-4">
                    <h3 className="font-medium text-lg">Allergens</h3>
                    <p className="text-neutral-600">
                      {listing.allergens || 'No allergen information provided'}
                    </p>
                  </div>
                  
                  {/* Food Category */}
                  <div>
                    <h3 className="font-medium text-lg">Category</h3>
                    <p className="text-neutral-600">{listing.category}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="location" className="p-4 bg-white rounded-b-lg border border-t-0">
                  <p className="text-neutral-600 mb-4">
                    {listing.location}
                    {getDistance() !== null && ` (${getDistance()?.toFixed(1)} miles away)`}
                  </p>
                  
                  {listing.latitude && listing.longitude && (
                    <div className="h-[300px] rounded-lg overflow-hidden">
                      <Map 
                        latitude={listing.latitude} 
                        longitude={listing.longitude}
                        markers={[{
                          id: listing.id,
                          lat: listing.latitude,
                          lng: listing.longitude,
                          title: listing.title,
                          isFeatured: listing.isFree
                        }]}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Warning Notice */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Food Safety Notice</p>
                      <p>Please take proper precautions when handling and consuming food from others. FoodShare is not responsible for the quality or safety of food items.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Seller Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">About the Provider</h3>
                  
                  {isSellerLoading ? (
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ) : seller ? (
                    <div>
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={seller.profileImage || undefined} alt={seller.name} />
                          <AvatarFallback className="bg-primary-100 text-primary-800">
                            {seller.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <h4 className="font-medium">{seller.name}</h4>
                          <p className="text-sm text-neutral-500">{seller.location}</p>
                        </div>
                      </div>
                      
                      {seller.bio && (
                        <div className="mt-4">
                          <p className="text-sm text-neutral-600">{seller.bio}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm">4.9 rating (36 reviews)</span>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      {!isOwner && (
                        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contact Provider
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Message to {seller.name}</DialogTitle>
                              <DialogDescription>
                                Send a message about "{listing.title}"
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Textarea
                              placeholder="Ask about pickup times, ingredients, etc."
                              className="min-h-[100px]"
                              value={messageContent}
                              onChange={(e) => setMessageContent(e.target.value)}
                            />
                            
                            <DialogFooter>
                              <Button 
                                className="bg-primary-500"
                                disabled={!messageContent.trim() || sendMessageMutation.isPending}
                                onClick={handleSendMessage}
                              >
                                {sendMessageMutation.isPending ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin mr-2">◌</div>
                                    Sending...
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                  </div>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  ) : (
                    <p className="text-neutral-600">Could not load provider information</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Order Card */}
              {!isOwner && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">
                        {listing.isFree ? 'Claim This Item' : 'Order Summary'}
                      </h3>
                      <Badge className={listing.isFree ? 'bg-blue-500' : 'bg-primary-500'}>
                        {listing.isFree ? 'Free' : `$${listing.price?.toFixed(2)}`}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Quantity:</span>
                        <span>{listing.quantity} {listing.quantity > 1 ? 'portions' : 'portion'}</span>
                      </div>
                      
                      {!listing.isFree && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Price:</span>
                            <span>${listing.price?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Service fee:</span>
                            <span>$0.00</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span>${listing.price?.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full bg-primary-500 hover:bg-primary-600"
                      onClick={handleOrderClick}
                      disabled={createTransactionMutation.isPending}
                    >
                      {createTransactionMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2">◌</div>
                          Processing...
                        </div>
                      ) : listing.isFree ? (
                        'Claim Now'
                      ) : (
                        'Order Now'
                      )}
                    </Button>
                    
                    <p className="text-xs text-neutral-500 text-center mt-3">
                      By ordering, you agree to FoodShare's terms of service and food safety guidelines.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Listing Management (for owner) */}
              {isOwner && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Manage Your Listing</h3>
                    <div className="space-y-3">
                      <Button className="w-full" variant="outline">
                        Edit Listing
                      </Button>
                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                        Mark as Unavailable
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-neutral-600 mb-6">The food listing you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/")} className="bg-primary-500 hover:bg-primary-600">
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}
