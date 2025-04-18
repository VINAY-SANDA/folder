import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, MapPin } from 'lucide-react';
import { FoodListing, User } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface FoodCardProps {
  listing: FoodListing;
  seller?: User;
  distance?: number;
  featured?: boolean;
}

export default function FoodCard({ listing, seller, distance, featured = false }: FoodCardProps) {
  const getExpirationText = () => {
    if (!listing.expiresAt) return 'No expiration set';
    return `Available until ${formatDistanceToNow(new Date(listing.expiresAt), { addSuffix: true })}`;
  };

  const getSellerInitials = () => {
    if (!seller || !seller.name) return 'U';
    return seller.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const displayPrice = listing.isFree ? 'Free' : `$${listing.price?.toFixed(2)}`;

  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition duration-300">
      <div className="relative">
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={listing.images[0]} 
            alt={listing.title} 
            className="w-full h-48 object-cover" 
          />
        ) : (
          <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
            <span className="material-icons text-neutral-400 text-4xl">restaurant</span>
          </div>
        )}
        
        {featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-secondary-500 hover:bg-secondary-600 text-white">Featured</Badge>
          </div>
        )}
        
        {listing.category && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 hover:bg-green-600 text-white">{listing.category}</Badge>
          </div>
        )}
        
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-primary-500 hover:bg-primary-600 text-white">{displayPrice}</Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{listing.title}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="ml-1 text-sm">4.8</span>
          </div>
        </div>
        
        <p className="text-neutral-600 text-sm mt-1">{listing.description}</p>
        
        <div className="flex items-center mt-3 text-sm text-neutral-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>{getExpirationText()}</span>
        </div>
        
        {distance !== undefined && (
          <div className="flex items-center mt-2 text-sm text-neutral-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{distance} miles away</span>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={seller?.profileImage || undefined} alt={seller?.name || 'Seller'} />
              <AvatarFallback className="bg-primary-100 text-primary-800 text-xs">
                {getSellerInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm font-medium">{seller?.name || 'Anonymous'}</span>
          </div>
          
          <Link href={`/listing/${listing.id}`}>
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm"
            >
              {listing.isFree ? 'Claim' : 'Order Now'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
