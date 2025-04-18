import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FoodListing } from '@shared/schema';
import { useGeolocation } from '@/lib/geolocation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Map } from '@/components/ui/map';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import FoodCard from '@/components/food-card';
import CategoryItem from '@/components/category-item';
import { calculateDistance } from '@/lib/geolocation';
import { Link, useLocation } from 'wouter';

export default function HomePage() {
  const { latitude, longitude, loading: locationLoading } = useGeolocation();
  const [searchRadius, setSearchRadius] = useState<string>("2");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  
  // Fetch food listings
  const { data: foodListings, isLoading } = useQuery<FoodListing[]>({
    queryKey: ["/api/food-listings"],
    enabled: true,
  });

  // Filter and sort listings
  const filteredListings = foodListings?.filter(listing => {
    if (activeFilters.includes('free-only') && !listing.isFree) return false;
    if (activeFilters.includes('vegetarian') && listing.category !== 'vegetarian') return false;
    return true;
  }) || [];
  
  // Calculate distance and sort by proximity
  const listingsWithDistance = filteredListings.map(listing => {
    let distance = 999;
    
    if (latitude && longitude && listing.latitude && listing.longitude) {
      distance = calculateDistance(
        latitude, 
        longitude, 
        listing.latitude, 
        listing.longitude
      );
    }
    
    return { listing, distance };
  }).sort((a, b) => a.distance - b.distance);
  
  // Get nearby listings within radius
  const nearbyListings = listingsWithDistance
    .filter(item => item.distance <= parseFloat(searchRadius))
    .slice(0, 5);
  
  // Handle filter toggle
  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };
  
  // Handle map marker click
  const handleMarkerClick = (id: number) => {
    setLocation(`/listing/${id}`);
  };

  // Create map markers from listings
  const mapMarkers = nearbyListings.map(({ listing }) => ({
    id: listing.id,
    lat: listing.latitude || 0,
    lng: listing.longitude || 0,
    title: listing.title,
    isFeatured: listing.isFree === true,
  }));

  return (
    <div className="bg-neutral-50 text-neutral-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Reduce Food Waste, One Meal at a Time</h2>
              <p className="text-lg mb-6">Share your extra food with neighbors or discover affordable homemade meals near you.</p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button className="bg-white text-primary-600 hover:bg-neutral-100 shadow-md">
                  Find Food Nearby
                </Button>
                <Link href="/create-listing">
                  <Button className="bg-secondary-500 hover:bg-secondary-600 text-white shadow-md">
                    Share Your Food
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1493770348161-369560ae357d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                alt="People sharing food" 
                className="rounded-lg shadow-xl max-w-full h-auto" 
                width="500" 
                height="333" 
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold font-heading mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <CategoryItem 
              icon="dinner_dining" 
              name="Home Cooked" 
              color="text-primary-500" 
              bgColor="bg-primary-100"
              href="/?category=home-cooked"
            />
            <CategoryItem 
              icon="bakery_dining" 
              name="Baked Goods" 
              color="text-secondary-500" 
              bgColor="bg-secondary-100"
              href="/?category=baked-goods"
            />
            <CategoryItem 
              icon="eco" 
              name="Vegetarian" 
              color="text-green-500" 
              bgColor="bg-green-100"
              href="/?category=vegetarian"
            />
            <CategoryItem 
              icon="restaurant" 
              name="Restaurant" 
              color="text-blue-500" 
              bgColor="bg-blue-100"
              href="/?category=restaurant"
            />
            <CategoryItem 
              icon="cake" 
              name="Desserts" 
              color="text-purple-500" 
              bgColor="bg-purple-100"
              href="/?category=desserts"
            />
            <CategoryItem 
              icon="more_horiz" 
              name="View All" 
              color="text-red-500" 
              bgColor="bg-red-100"
              href="/"
            />
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 p-6">
                <h2 className="text-2xl font-bold font-heading mb-4">Food Near You</h2>
                <p className="text-neutral-600 mb-6">Discover available food within your neighborhood. Adjust the distance to see more options.</p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Distance</label>
                  <Select 
                    defaultValue={searchRadius} 
                    onValueChange={setSearchRadius}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5 miles</SelectItem>
                      <SelectItem value="1">1 mile</SelectItem>
                      <SelectItem value="2">2 miles</SelectItem>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Filters</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={activeFilters.includes('free-only') ? 'default' : 'outline'}
                      className={activeFilters.includes('free-only') ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' : ''}
                      onClick={() => toggleFilter('free-only')}
                    >
                      Free only
                    </Badge>
                    <Badge 
                      variant={activeFilters.includes('vegetarian') ? 'default' : 'outline'}
                      className={activeFilters.includes('vegetarian') ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' : ''}
                      onClick={() => toggleFilter('vegetarian')}
                    >
                      Vegetarian
                    </Badge>
                    <Badge 
                      variant={activeFilters.includes('available-now') ? 'default' : 'outline'}
                      className={activeFilters.includes('available-now') ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' : ''}
                      onClick={() => toggleFilter('available-now')}
                    >
                      Available now
                    </Badge>
                    <Badge 
                      variant={activeFilters.includes('delivery') ? 'default' : 'outline'}
                      className={activeFilters.includes('delivery') ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' : ''}
                      onClick={() => toggleFilter('delivery')}
                    >
                      Delivery
                    </Badge>
                  </div>
                </div>
                
                {/* Search Results Preview */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">
                    {isLoading ? 'Loading results...' : `${nearbyListings.length} Results Found`}
                  </h3>
                  
                  <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                    {isLoading ? (
                      // Loading skeletons
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                          <div className="flex items-center">
                            <Skeleton className="w-16 h-16 rounded-md" />
                            <div className="ml-3 space-y-2 w-full">
                              <Skeleton className="h-4 w-2/3" />
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-3 w-1/4" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : nearbyListings.length > 0 ? (
                      // Nearby listings
                      nearbyListings.map(({ listing, distance }) => (
                        <Link key={listing.id} href={`/listing/${listing.id}`}>
                          <div className="block bg-neutral-50 rounded-lg p-3 border border-neutral-200 cursor-pointer hover:border-primary-300 transition duration-200">
                            <div className="flex items-center">
                              {listing.images && listing.images.length > 0 ? (
                                <img 
                                  src={listing.images[0]}
                                  alt={listing.title} 
                                  className="w-16 h-16 rounded-md object-cover" 
                                />
                              ) : (
                                <div className="w-16 h-16 bg-neutral-200 rounded-md flex items-center justify-center">
                                  <span className="material-icons text-neutral-400">restaurant</span>
                                </div>
                              )}
                              <div className="ml-3">
                                <h4 className="font-medium">{listing.title}</h4>
                                <p className="text-sm text-neutral-600">
                                  {distance.toFixed(1)} miles away • {listing.isFree ? 'Free' : `$${listing.price?.toFixed(2)}`}
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className="material-icons text-yellow-500 text-sm">star</span>
                                  <span className="text-xs ml-1">4.8 (24)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      // No results
                      <Card>
                        <CardContent className="py-4 text-center text-neutral-500">
                          No food listings found nearby. Try increasing the search radius.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3 h-[500px]">
                {latitude && longitude ? (
                  <Map 
                    latitude={latitude} 
                    longitude={longitude} 
                    markers={mapMarkers}
                    onMarkerClick={handleMarkerClick}
                  />
                ) : (
                  <div className="h-full bg-neutral-100 flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons text-5xl text-neutral-400">location_off</span>
                      <p className="mt-2 text-neutral-500">
                        {locationLoading ? 'Detecting your location...' : 'Please enable location services to see the map'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Listings Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-heading">Featured Food Listings</h2>
            <Link href="/">
              <div className="text-primary-600 hover:text-primary-700 font-medium flex items-center cursor-pointer">
                View all <span className="material-icons ml-1 text-base">arrow_forward</span>
              </div>
            </Link>
          </div>
          
          {isLoading ? (
            // Loading skeletons
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-6 w-1/6" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-10 w-1/3 rounded-full" />
                      <Skeleton className="h-10 w-1/3 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {foodListings?.slice(0, 4).map(listing => (
                <FoodCard 
                  key={listing.id} 
                  listing={listing} 
                  featured={listing.id % 3 === 0} // Just for demo
                  distance={
                    latitude && longitude && listing.latitude && listing.longitude
                      ? calculateDistance(latitude, longitude, listing.latitude, listing.longitude)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-12 bg-neutral-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold font-heading text-center mb-12">How FoodShare Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <span className="material-icons text-2xl">restaurant</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Share Your Extra Food</h3>
              <p className="text-neutral-600">Take a photo, add details about your food, and set a price (or make it free).</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <span className="material-icons text-2xl">search</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Discover Local Food</h3>
              <p className="text-neutral-600">Browse available food in your area, filter by preferences, and communicate with providers.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <span className="material-icons text-2xl">handshake</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Complete the Transaction</h3>
              <p className="text-neutral-600">Arrange pickup or delivery, pay through the app, and enjoy your meal while reducing food waste.</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/auth">
              <Button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-8 rounded-full shadow-md">
                Join FoodShare Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold font-heading text-center mb-6">What Our Community Says</h2>
          <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">FoodShare is bringing communities together while reducing food waste, one meal at a time.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-card">
              <div className="flex items-center mb-4">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Emma L." />
                  <AvatarFallback>EL</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h4 className="font-bold">Emma L.</h4>
                  <div className="flex text-yellow-500">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} className="material-icons text-sm">star</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-neutral-600">"I used to throw away so much food after cooking too much. Now I can share it with neighbors and even make a little extra money. It's a win-win!"</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-card">
              <div className="flex items-center mb-4">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Jason T." />
                  <AvatarFallback>JT</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h4 className="font-bold">Jason T.</h4>
                  <div className="flex text-yellow-500">
                    {Array(4).fill(0).map((_, i) => (
                      <span key={i} className="material-icons text-sm">star</span>
                    ))}
                    <span className="material-icons text-sm">star_half</span>
                  </div>
                </div>
              </div>
              <p className="text-neutral-600">"As a college student, I've found amazing home-cooked meals for less than takeout prices. It's helped me eat better on a budget."</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-card">
              <div className="flex items-center mb-4">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Maria R." />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h4 className="font-bold">Maria R.</h4>
                  <div className="flex text-yellow-500">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} className="material-icons text-sm">star</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-neutral-600">"I've met so many wonderful people in my community through FoodShare. It's more than just food - it's about connection."</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Download App Section */}
      <section className="py-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold font-heading mb-4">Get the FoodShare App</h2>
              <p className="text-lg mb-6">Download our mobile app to easily share and discover food on the go. Available for iOS and Android.</p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button className="bg-black hover:bg-neutral-800 text-white shadow-md" variant="outline">
                  <span className="material-icons mr-2">apple</span>
                  App Store
                </Button>
                <Button className="bg-black hover:bg-neutral-800 text-white shadow-md" variant="outline">
                  <span className="material-icons mr-2">android</span>
                  Google Play
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                alt="Mobile app mockup" 
                className="rounded-lg shadow-xl max-w-xs h-auto" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
