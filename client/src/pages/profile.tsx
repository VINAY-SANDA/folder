import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { FoodListing, Transaction } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, EyeIcon, PlusCircle, TrashIcon } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, User, MapPin, Mail, Phone, Star, Clock, Edit } from 'lucide-react';
import FoodCard from '@/components/food-card';

// Define schema for profile update
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  location: z.string().min(3, "Please provide a valid location"),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
});

// Component for managing food listings
function ManageListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: listings = [], isLoading, refetch } = useQuery<FoodListing[]>({
    queryKey: ['/api/users', user?.id, 'food-listings'],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/food-listings/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete listing');
      }
      return id;
    },
    onSuccess: () => {
      refetch();
      toast({
        title: 'Listing deleted',
        description: 'Your food listing has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const res = await apiRequest('PUT', `/api/food-listings/${id}`, { isAvailable });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update listing');
      }
      return { id, isAvailable };
    },
    onSuccess: () => {
      refetch();
      toast({
        title: 'Listing updated',
        description: 'Availability status updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
        <p className="text-gray-500 mb-4">You haven't created any food listings yet.</p>
        <Button asChild>
          <Link href="/create-listing">Create Your First Listing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Your Food Listings</h3>
        <Button asChild variant="outline">
          <Link href="/create-listing">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            <div className="relative">
              {listing.images && listing.images.length > 0 && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={listing.isAvailable ? "default" : "secondary"}>
                  {listing.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h4 className="font-semibold text-lg truncate">{listing.title}</h4>
              <p className="text-sm text-gray-500 mb-2 truncate">{listing.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <p><CalendarIcon className="inline w-4 h-4 mr-1" /> 
                    Expires: {new Date(listing.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {listing.price ? (
                    <p className="font-semibold">${listing.price.toFixed(2)}</p>
                  ) : (
                    <Badge variant="outline" className="bg-green-50">Free</Badge>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleAvailability.mutate({ 
                    id: listing.id, 
                    isAvailable: !listing.isAvailable 
                  })}
                  disabled={toggleAvailability.isPending}
                >
                  {listing.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    asChild
                  >
                    <Link href={`/listing/${listing.id}`}>
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this listing?')) {
                        deleteMutation.mutate(listing.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user's food listings
  const { data: userListings, isLoading: listingsLoading } = useQuery<FoodListing[]>({
    queryKey: [`/api/users/${user?.id}/food-listings`],
    enabled: !!user,
  });
  
  // Fetch user's transactions
  const { data: userTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });

  // Profile update form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      location: user?.location || '',
      bio: user?.bio || '',
      profileImage: user?.profileImage || '',
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PUT", "/api/users/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile update submission
  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-2">Loading Profile</h1>
        <p className="text-neutral-600">Please wait while we load your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user.profileImage || undefined} alt={user.name} />
                        <AvatarFallback className="bg-primary-100 text-primary-800 text-2xl">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Tell others about yourself" 
                              className="resize-none"
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description that will be visible to others
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex space-x-3 pt-2">
                      <Button 
                        type="submit"
                        className="flex-1 bg-primary-500"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div>
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={user.profileImage || undefined} alt={user.name} />
                      <AvatarFallback className="bg-primary-100 text-primary-800 text-2xl">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-neutral-500">@{user.username}</p>
                    
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="ml-1">4.9 rating (36 reviews)</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline" 
                    className="w-full flex items-center justify-center mb-6"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  
                  <Separator className="mb-6" />
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-neutral-500 mt-0.5 mr-3" />
                      <div>
                        <h3 className="font-medium">Location</h3>
                        <p className="text-neutral-600">{user.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-neutral-500 mt-0.5 mr-3" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-neutral-600">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-neutral-500 mt-0.5 mr-3" />
                      <div>
                        <h3 className="font-medium">Bio</h3>
                        <p className="text-neutral-600">{user.bio || 'No bio provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-neutral-500 mt-0.5 mr-3" />
                      <div>
                        <h3 className="font-medium">Member Since</h3>
                        <p className="text-neutral-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Listings and Transactions Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="myListings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="myListings">My Food Listings</TabsTrigger>
              <TabsTrigger value="transactions">My Transactions</TabsTrigger>
            </TabsList>
            
            {/* My Listings Tab */}
            <TabsContent value="myListings">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>My Food Listings</CardTitle>
                  <CardDescription>
                    Manage the food items you've shared with your community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {listingsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <Skeleton className="w-full h-40" />
                          <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-6 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : userListings && userListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userListings.map(listing => (
                        <FoodCard 
                          key={listing.id}
                          listing={listing}
                          seller={user}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🍽️</div>
                      <h3 className="text-xl font-bold mb-2">No Food Listings Yet</h3>
                      <p className="text-neutral-600 mb-6">
                        You haven't shared any food with your community yet.
                      </p>
                      <Button className="bg-primary-500 hover:bg-primary-600" onClick={() => window.location.href = '/create-listing'}>
                        Share Your First Food Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>My Transactions</CardTitle>
                  <CardDescription>
                    Track your food orders and sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <Card key={i} className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : userTransactions && userTransactions.length > 0 ? (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4 pr-4">
                        {userTransactions.map(transaction => (
                          <Card key={transaction.id} className="p-4">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <div>
                                <h3 className="font-medium">
                                  {transaction.buyerId === user.id ? 'Purchased' : 'Sold'} Item #{transaction.listingId}
                                </h3>
                                <p className="text-sm text-neutral-500">
                                  {new Date(transaction.createdAt).toLocaleDateString()} • 
                                  {transaction.amount > 0 ? ` $${transaction.amount.toFixed(2)}` : ' Free'}
                                </p>
                              </div>
                              <Badge className={
                                transaction.status === 'completed' 
                                  ? 'bg-green-500'
                                  : transaction.status === 'cancelled'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🛒</div>
                      <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
                      <p className="text-neutral-600 mb-6">
                        You haven't bought or sold any food items yet.
                      </p>
                      <Button className="bg-primary-500 hover:bg-primary-600" onClick={() => window.location.href = '/'}>
                        Browse Food Listings
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
