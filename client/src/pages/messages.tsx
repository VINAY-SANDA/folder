import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Message, User } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Send, SearchIcon } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all messages for current user
  const { data: allMessages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!user,
  });

  // Get unique conversation partners
  const uniqueUserIds = allMessages 
    ? [...new Set(allMessages.map(msg => 
        msg.senderId === user?.id ? msg.receiverId : msg.senderId
      ))]
    : [];

  // Fetch conversation partners' details
  const { data: conversationPartners, isLoading: partnersLoading } = useQuery<User[]>({
    queryKey: ['/api/users/conversations'],
    queryFn: async () => {
      const promises = uniqueUserIds.map(id => 
        fetch(`/api/users/${id}`, { credentials: 'include' })
          .then(res => res.json())
      );
      return Promise.all(promises);
    },
    enabled: uniqueUserIds.length > 0,
  });

  // Fetch selected conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Get selected user details
  const selectedUser = conversationPartners?.find(partner => partner.id === selectedUserId);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", message);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
      setMessageInput('');
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
    },
  });

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !messageInput.trim()) return;

    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageInput,
    });
  };

  // Mark unread messages as read when conversation is opened
  useEffect(() => {
    if (selectedUserId && conversation) {
      const unreadMessages = conversation.filter(msg => 
        !msg.isRead && msg.senderId === selectedUserId
      );

      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [selectedUserId, conversation]);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Filter conversation partners by search query
  const filteredPartners = conversationPartners?.filter(partner => 
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unread message count for a conversation
  const getUnreadCount = (partnerId: number) => {
    if (!allMessages) return 0;
    return allMessages.filter(msg => 
      msg.senderId === partnerId && !msg.isRead
    ).length;
  };

  // Format message timestamp
  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="md:col-span-1">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Conversations</CardTitle>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  className="pl-9 bg-neutral-50"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-hidden p-0">
              <ScrollArea className="h-full p-3">
                {messagesLoading || partnersLoading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-start p-3 gap-3 hover:bg-neutral-100 rounded-lg mb-1">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-grow">
                        <Skeleton className="h-5 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : filteredPartners && filteredPartners.length > 0 ? (
                  filteredPartners.map(partner => (
                    <button
                      key={partner.id}
                      className={`flex items-start p-3 gap-3 hover:bg-neutral-100 rounded-lg mb-1 w-full text-left ${
                        selectedUserId === partner.id ? 'bg-neutral-100' : ''
                      }`}
                      onClick={() => setSelectedUserId(partner.id)}
                    >
                      <Avatar>
                        <AvatarImage src={partner.profileImage || undefined} alt={partner.name} />
                        <AvatarFallback className="bg-primary-100 text-primary-800">
                          {getUserInitials(partner.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <span className="font-medium">{partner.name}</span>
                          {getUnreadCount(partner.id) > 0 && (
                            <span className="bg-primary-500 text-white text-xs px-2 rounded-full">
                              {getUnreadCount(partner.id)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 truncate">
                          {/* Show last message preview */}
                          {allMessages
                            ?.filter(msg => 
                              msg.senderId === partner.id || msg.receiverId === partner.id
                            )
                            .sort((a, b) => 
                              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                            )[0]?.content?.slice(0, 30) + '...' || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="text-4xl mb-3">💬</div>
                    <h3 className="font-medium text-lg">No conversations yet</h3>
                    <p className="text-neutral-500 mt-1">
                      Start browsing food listings and message providers to begin conversations
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Conversation View */}
        <div className="md:col-span-2">
          <Card className="h-[700px] flex flex-col">
            {selectedUserId ? (
              <>
                <CardHeader className="pb-3 border-b">
                  {partnersLoading ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-6 w-1/3" />
                    </div>
                  ) : selectedUser ? (
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedUser.profileImage || undefined} alt={selectedUser.name} />
                        <AvatarFallback className="bg-primary-100 text-primary-800">
                          {getUserInitials(selectedUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                        <p className="text-sm text-neutral-500">{selectedUser.location}</p>
                      </div>
                    </div>
                  ) : (
                    <CardTitle>Loading conversation...</CardTitle>
                  )}
                </CardHeader>
                
                <CardContent className="flex-grow overflow-hidden p-0 relative">
                  {/* Messages */}
                  <ScrollArea className="h-[560px] px-4 pt-4">
                    {conversationLoading ? (
                      // Loading skeletons for messages
                      <div className="space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-neutral-100' : 'bg-primary-100'} rounded-lg p-3`}>
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : conversation && conversation.length > 0 ? (
                      <div className="space-y-4">
                        {conversation
                          .sort((a, b) => 
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                          )
                          .map(message => (
                            <div 
                              key={message.id} 
                              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[70%] ${
                                  message.senderId === user?.id 
                                    ? 'bg-primary-100 text-primary-800' 
                                    : 'bg-neutral-100'
                                } rounded-lg p-3`}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs text-neutral-500 mt-1 text-right">
                                  {formatMessageTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="text-4xl mb-3">👋</div>
                        <h3 className="font-medium text-lg">Start the conversation</h3>
                        <p className="text-neutral-500 mt-1">
                          Send your first message to {selectedUser?.name}
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="border-t p-3">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <Input
                        className="flex-grow"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        className="bg-primary-500"
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="animate-spin">◌</div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
                <p className="text-neutral-600 max-w-md mb-6">
                  Select a conversation from the left or start a new one by messaging a food provider
                </p>
                <Button 
                  onClick={() => window.history.back()} 
                  className="bg-primary-500"
                >
                  Browse Food Listings
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
