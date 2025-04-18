import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Extended schema with validation rules
const registerFormSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please provide a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(3, "Please provide a valid location"),
});

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();

  // Login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      location: "",
      bio: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: z.infer<typeof loginFormSchema>) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegisterSubmit = (data: z.infer<typeof registerFormSchema>) => {
    registerMutation.mutate(data);
  };

  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row items-stretch gap-8">
        {/* Form Section */}
        <div className="lg:w-1/2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-bold">
                Welcome to FoodShare
              </CardTitle>
              <CardDescription className="text-center">
                Join our community to reduce food waste and share delicious meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary-500 hover:bg-primary-600 mt-2"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          'Login'
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center text-sm text-neutral-600">
                    Don't have an account?{" "}
                    <button 
                      className="text-primary-600 hover:underline"
                      onClick={() => setActiveTab("register")}
                    >
                      Create one now
                    </button>
                  </div>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, State" {...field} />
                            </FormControl>
                            <FormDescription>
                              Your general location helps connect you with nearby food
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us a bit about yourself" 
                                className="resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              This helps build trust in the community
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary-500 hover:bg-primary-600 mt-2"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center text-sm text-neutral-600">
                    Already have an account?{" "}
                    <button 
                      className="text-primary-600 hover:underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Login instead
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Hero Section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-8 text-white flex flex-col justify-center">
          <div className="max-w-md mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary-600">
                <span className="material-icons">eco</span>
              </div>
              <h1 className="ml-3 text-3xl font-bold">Food<span className="text-secondary-400">Share</span></h1>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Reduce Food Waste, Connect Communities</h2>
            
            <p className="text-lg mb-6">
              Join thousands of people sharing home-cooked meals, restaurant leftovers, and garden harvests with their neighbors.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-3 mt-1 bg-white bg-opacity-20 p-1 rounded-full">
                  <span className="material-icons">check_circle</span>
                </div>
                <p>Share your extra food and reduce waste while earning extra income</p>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-1 bg-white bg-opacity-20 p-1 rounded-full">
                  <span className="material-icons">check_circle</span>
                </div>
                <p>Discover affordable, homemade meals from your local community</p>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-1 bg-white bg-opacity-20 p-1 rounded-full">
                  <span className="material-icons">check_circle</span>
                </div>
                <p>Connect with neighbors and build a more sustainable future together</p>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <div className="flex items-center mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                    alt="User" 
                    className="w-10 h-10 rounded-full" 
                  />
                  <div className="ml-3">
                    <p className="font-bold">Emma L.</p>
                    <div className="flex text-yellow-300">
                      <span className="material-icons text-sm">star</span>
                      <span className="material-icons text-sm">star</span>
                      <span className="material-icons text-sm">star</span>
                      <span className="material-icons text-sm">star</span>
                      <span className="material-icons text-sm">star</span>
                    </div>
                  </div>
                </div>
                <p className="italic text-sm">
                  "FoodShare has changed how I think about food. I've saved money, reduced waste, and met amazing people in my neighborhood!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
