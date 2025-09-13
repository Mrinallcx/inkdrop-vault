import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TagsInput } from '@/components/ui/tags-input';
import { FileText, Zap, DollarSign, Shield, Settings, Upload, X, Info, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MintingFlow from './MintingFlow';

// Simplified schema with only essential fields
const formSchema = z.object({
  // Basic Information
  assetTitle: z.string().min(1, 'Asset title is required').max(120, 'Title must be under 120 characters'),
  shortDescription: z.string().min(1, 'Description is required').max(1000, 'Description must be under 1000 characters'),
  categoryTags: z.array(z.string()).optional(),
  creatorName: z.string().min(1, 'Creator name is required'),
  externalLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // Token Settings
  tokenStandard: z.enum(['ERC-721', 'ERC-1155']),
  supplyEditionSize: z.number().min(1, 'Supply must be at least 1').max(10000, 'Supply cannot exceed 10000'),
  primaryChain: z.enum(['ethereum', 'polygon', 'bnb', 'solana', 'avalanche', 'arbitrum', 'optimism']),
  mintingMode: z.enum(['direct', 'lazy']),

  // Sales & Pricing
  listOnMarketplace: z.boolean(),
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.enum(['ETH', 'MATIC', 'BNB', 'SOL', 'AVAX', 'USDC']).optional(),

  // Royalties
  royaltyPercentage: z.number().min(0, 'Royalty must be positive').max(20, 'Royalty cannot exceed 20%'),
  royaltyRecipient: z.string().min(1, 'Royalty recipient address is required'),

  // Legal
  jurisdictionTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

type FormData = z.infer<typeof formSchema>;

interface SimpleFileDetailsFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const SimpleFileDetailsForm: React.FC<SimpleFileDetailsFormProps> = ({ onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [showMintingFlow, setShowMintingFlow] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [devMode, setDevMode] = useState(false);

  const getDefaultValues = (): FormData => ({
    assetTitle: devMode ? 'Test NFT Asset Title' : '',
    shortDescription: devMode ? 'This is a test NFT created for development and testing purposes.' : '',
    categoryTags: devMode ? ['art', 'digital', 'test'] : [],
    creatorName: devMode ? 'Test Creator' : '',
    externalLink: devMode ? 'https://example.com/portfolio' : '',
    tokenStandard: 'ERC-721',
    supplyEditionSize: 1,
    primaryChain: 'ethereum',
    mintingMode: 'direct',
    listOnMarketplace: false,
    price: 0,
    currency: 'ETH',
    royaltyPercentage: 5,
    royaltyRecipient: devMode ? '0x742d35Cc123C6f34E05861B22048B456123456789' : '',
    jurisdictionTerms: devMode ? true : false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const handleSubmit = (data: FormData) => {
    console.log('NFT Minting Form submitted:', data);
    setFormData(data);
    setShowMintingFlow(true);
  };

  const handleMintingComplete = () => {
    setShowMintingFlow(false);
    setFormData(null);
    onCancel();
  };

  const handleBackFromMinting = () => {
    setShowMintingFlow(false);
  };

  const fillTestData = () => {
    setDevMode(true);
    form.reset(getDefaultValues());
    toast({
      title: "Test data filled",
      description: "All required fields have been populated with test values",
    });
  };

  if (showMintingFlow && formData) {
    return (
      <MintingFlow 
        formData={formData}
        onComplete={handleMintingComplete}
        onBack={handleBackFromMinting}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card border rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create NFT</h2>
              <p className="text-muted-foreground">Simple and streamlined minting process</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fillTestData}
            >
              Fill Test Data
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCancel}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="blockchain" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Blockchain
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Sales & Royalties
                </TabsTrigger>
                <TabsTrigger value="legal" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Legal
                </TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="assetTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter asset title" {...field} />
                            </FormControl>
                            <FormDescription>Max 120 characters</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creatorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Creator Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name or artist name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your NFT (1-3 sentences)"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Max 1000 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryTags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (Optional)</FormLabel>
                            <FormControl>
                              <TagsInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="art, music, collectible"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="externalLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>External Link (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="url"
                                placeholder="https://your-portfolio.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Blockchain Tab */}
              <TabsContent value="blockchain" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Blockchain Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tokenStandard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Standard *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ERC-721">ERC-721 (Unique NFT)</SelectItem>
                                <SelectItem value="ERC-1155">ERC-1155 (Multi-Edition)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supplyEditionSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supply/Edition Size *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={10000}
                                placeholder="1"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormDescription>1 for unique, multiple for editions</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primaryChain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blockchain *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ethereum">⟡ Ethereum</SelectItem>
                                <SelectItem value="polygon">🔷 Polygon</SelectItem>
                                <SelectItem value="bnb">🟡 BNB Chain</SelectItem>
                                <SelectItem value="solana">🌅 Solana</SelectItem>
                                <SelectItem value="avalanche">🔺 Avalanche</SelectItem>
                                <SelectItem value="arbitrum">🔵 Arbitrum</SelectItem>
                                <SelectItem value="optimism">🔴 Optimism</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mintingMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minting Mode *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="direct">Direct Mint (Pay gas now)</SelectItem>
                                <SelectItem value="lazy">Lazy Mint (Pay gas when sold)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sales & Royalties Tab */}
              <TabsContent value="sales" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales & Royalties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="listOnMarketplace"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>List on Marketplace</FormLabel>
                            <FormDescription>
                              Automatically list for sale after minting
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('listOnMarketplace') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sale Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min={0}
                                  placeholder="0.1"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ETH">ETH</SelectItem>
                                  <SelectItem value="MATIC">MATIC</SelectItem>
                                  <SelectItem value="BNB">BNB</SelectItem>
                                  <SelectItem value="SOL">SOL</SelectItem>
                                  <SelectItem value="AVAX">AVAX</SelectItem>
                                  <SelectItem value="USDC">USDC</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="royaltyPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Royalty Percentage *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                max={20}
                                placeholder="5"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>0-20% of future sales</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="royaltyRecipient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Royalty Recipient Address *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0x..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>Wallet to receive royalties</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Legal Tab */}
              <TabsContent value="legal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal & Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        By minting this NFT, you confirm that you own the rights to the content and comply with all applicable laws.
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={form.control}
                      name="jurisdictionTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              I agree to the terms and conditions *
                            </FormLabel>
                            <FormDescription>
                              I confirm that I have the legal right to mint this content as an NFT and comply with platform terms.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Submit Section */}
            <Card>
              <CardHeader>
                <CardTitle>Review & Mint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="space-y-1">
                    <div><strong>Chain:</strong> {form.watch('primaryChain')}</div>
                    <div><strong>Standard:</strong> {form.watch('tokenStandard')}</div>
                    <div><strong>Supply:</strong> {form.watch('supplyEditionSize')}</div>
                    <div><strong>Royalty:</strong> {form.watch('royaltyPercentage')}%</div>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" className="flex-1" size="lg">
                    <Save className="w-4 h-4 mr-2" />
                    Confirm & Start Minting
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel} size="lg">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SimpleFileDetailsForm;