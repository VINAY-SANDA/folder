import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Instagram, ArrowRight } from 'lucide-react';

export default function Footer() {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter subscription functionality would go here
  };

  return (
    <footer className="bg-neutral-800 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <span className="material-icons">eco</span>
              </div>
              <h3 className="ml-2 text-xl font-bold font-heading">Food<span className="text-secondary-500">Share</span></h3>
            </div>
            <p className="text-neutral-400 mb-4">Reducing food waste, one meal at a time. Connect with your community through sharing food.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white transition duration-200">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition duration-200">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition duration-200">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Featured Food
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Safety Information
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-400 hover:text-white transition duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Subscribe to Our Newsletter</h4>
            <p className="text-neutral-400 mb-4">Get the latest updates on new features and local food sharing opportunities.</p>
            <form className="flex" onSubmit={handleNewsletterSubmit}>
              <Input 
                type="email" 
                placeholder="Your email address" 
                className="rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-neutral-700 text-white border-0"
              />
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white rounded-l-none">
                <ArrowRight size={20} />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 pt-8 mt-8 text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} FoodShare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
