import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquare, Plus, Compass } from 'lucide-react';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <span className="material-icons">eco</span>
              </div>
              <h1 className="ml-2 text-2xl font-bold font-heading text-primary-600">Food<span className="text-secondary-500">Share</span></h1>
            </Link>
          </div>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search for food near you..."
                className="w-full pl-4 pr-10 py-2 rounded-full border border-neutral-300 focus:ring-2 focus:ring-primary-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-primary-500"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-1 md:space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className={`p-2 ${location === '/' ? 'text-primary-500' : 'text-neutral-600 hover:text-primary-500'} flex flex-col items-center text-xs`}>
                <Compass className="h-5 w-5 mb-1" />
                <span className="hidden md:inline">Discover</span>
              </Button>
            </Link>
            
            {user && (
              <>
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className={`p-2 ${location === '/messages' ? 'text-primary-500' : 'text-neutral-600 hover:text-primary-500'} flex flex-col items-center text-xs`}>
                    <MessageSquare className="h-5 w-5 mb-1" />
                    <span className="hidden md:inline">Messages</span>
                  </Button>
                </Link>
                
                <Link href="/create-listing">
                  <Button variant="ghost" size="sm" className={`p-2 ${location === '/create-listing' ? 'text-primary-500' : 'text-neutral-600 hover:text-primary-500'} flex flex-col items-center text-xs`}>
                    <Plus className="h-5 w-5 mb-1" />
                    <span className="hidden md:inline">Share Food</span>
                  </Button>
                </Link>
              </>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 h-10 w-10">
                    <Avatar>
                      <AvatarImage src={user.profileImage || undefined} alt={user.name} />
                      <AvatarFallback className="bg-primary-100 text-primary-800">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Your Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Your Listings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer">Transactions</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="default" className="bg-primary-500 hover:bg-primary-600">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
        
        {/* Search Bar - Mobile */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="relative w-full">
            <Input
              type="text"
              placeholder="Search for food near you..."
              className="w-full pl-4 pr-10 py-2 rounded-full border border-neutral-300 focus:ring-2 focus:ring-primary-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit"
              variant="ghost" 
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-primary-500"
            >
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
