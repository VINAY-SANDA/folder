import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { insertFoodListingSchema, InsertFoodListing } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useGeolocation } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';

// Extended schema with validation rules
const foodListingFormSchema = insertFoodListingSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price cannot be negative").nullable().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  expiresAt: z.date().refine(date => date > new Date(), "Expiration date must be in the future"),
});

// Food categories
const FOOD_CATEGORIES = [
  { value: "home-cooked", label: "Home Cooked" },
  { value: "baked-goods", label: "Baked Goods" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "restaurant", label: "Restaurant" },
  { value: "desserts", label: "Desserts" },
  { value: "other", label: "Other" },
];

export default function FoodListingForm() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { latitude, longitude, error: geoError } = useGeolocation();

  // Form setup
  const form = useForm<z.infer<typeof foodListingFormSchema>>({
    resolver: zodResolver(foodListingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      isFree: false,
      quantity: 1,
      portionSize: "",
      category: "",
      ingredients: "",
      allergens: "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      location: user?.location || "",
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      userId: user?.id,
    },
  });

  // Update location when geolocation is available
  if (latitude && longitude && !form.getValues().latitude) {
    form.setValue("latitude", latitude);
    form.setValue("longitude", longitude);
  }

  // Handle form submission
  const createListingMutation = useMutation({
    mutationFn: async (data: InsertFoodListing) => {
      const res = await apiRequest("POST", "/api/food-listings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-listings"] });
      toast({
        title: "Listing created!",
        description: "Your food listing has been successfully created.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle image upload (simulated)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingImage(true);
    
    // Simulate image upload - in a real app, you would upload to a service like Cloudinary
    setTimeout(() => {
      const file = e.target.files![0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setImageUrls(prev => [...prev, event.target!.result as string]);
          setUploadingImage(false);
        }
      };
      
      reader.readAsDataURL(file);
    }, 1000);
  };
  
  // Handle form submit
  const onSubmit = (data: z.infer<typeof foodListingFormSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a listing",
        variant: "destructive",
      });
      return;
    }
    
    // Add images and user ID to the data
    const listingData: InsertFoodListing = {
      ...data,
      images: imageUrls,
      userId: user.id,
    };
    
    // If item is free, set price to 0
    if (listingData.isFree) {
      listingData.price = 0;
    }
    
    createListingMutation.mutate(listingData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Food Listing</CardTitle>
        <CardDescription>
          Share your extra food with the community. Provide detailed information to help others decide if your food meets their needs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Homemade Lasagna" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your listing a descriptive title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your food, how it was prepared, etc." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FOOD_CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredients</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List main ingredients" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allergens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergens</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List potential allergens (nuts, dairy, etc.)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Images</h3>
              
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  id="food-image"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                
                <label
                  htmlFor="food-image"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="material-icons text-4xl text-neutral-400">add_photo_alternate</span>
                  <span className="mt-2 text-neutral-500">
                    {uploadingImage ? 'Uploading...' : 'Upload food photos'}
                  </span>
                </label>
                
                {imageUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden h-24">
                        <img src={url} alt={`Food ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-neutral-800 bg-opacity-70 rounded-full p-1 text-white"
                          onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Quantity and Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Quantity and Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="portionSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portion Size</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Serves 2-3 people" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Offer for free</FormLabel>
                      <FormDescription>
                        Check this if you want to offer this food for free
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {!form.watch("isFree") && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Availability</h3>
              
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Available Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When will this food no longer be available?
                    </FormDescription>
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
                      <Input 
                        placeholder="Your address or neighborhood" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This helps people find food near them
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {geoError && (
                <div className="text-sm text-red-500">
                  Location error: {geoError}. Please enter your address manually.
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary-500 hover:bg-primary-600"
              disabled={createListingMutation.isPending}
            >
              {createListingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Listing...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
