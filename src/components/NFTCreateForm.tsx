import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useNFTManagement } from '@/hooks/useNFTManagement';
import FileUpload from './FileUpload';
import type { Database } from '@/integrations/supabase/types';

interface Attribute {
  trait_type: string;
  value: string;
}

interface NFTCreateFormProps {
  onSuccess?: (nft: Database['public']['Tables']['nft_tokens']['Row']) => void;
  onCancel?: () => void;
}

export const NFTCreateForm = ({ onSuccess, onCancel }: NFTCreateFormProps) => {
  const { createNFT, loading } = useNFTManagement();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    external_url: '',
    blockchain: 'ethereum',
    token_standard: 'ERC721',
    royalty_percentage: 0,
    royalty_recipient: '',
    mint_price: undefined as number | undefined,
    current_price: undefined as number | undefined,
    image_file_id: undefined as string | undefined,
    animation_file_id: undefined as string | undefined,
  });

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttribute, setNewAttribute] = useState<Attribute>({ trait_type: '', value: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    try {
      const nftData = {
        name: formData.name,
        description: formData.description || undefined,
        external_url: formData.external_url || undefined,
        blockchain: formData.blockchain,
        token_standard: formData.token_standard,
        royalty_percentage: formData.royalty_percentage,
        royalty_recipient: formData.royalty_recipient || undefined,
        mint_price: formData.mint_price,
        current_price: formData.current_price,
        image_file_id: formData.image_file_id,
        animation_file_id: formData.animation_file_id,
        attributes: attributes as any,
        properties: {} as any,
        levels: {} as any,
        stats: {} as any,
      };

      const result = await createNFT(nftData);
      onSuccess?.(result);
    } catch (error) {
      console.error('Failed to create NFT:', error);
    }
  };

  const addAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setAttributes([...attributes, newAttribute]);
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create NFT</CardTitle>
        <CardDescription>
          Create a new NFT token with metadata and attributes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="NFT Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Blockchain *</label>
              <Select 
                value={formData.blockchain} 
                onValueChange={(value) => setFormData({ ...formData, blockchain: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="cardano">Cardano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              placeholder="Describe your NFT..."
              className="min-h-24"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <p className="text-sm text-muted-foreground mb-2">Upload NFT image file</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Animation (Optional)</label>
                <p className="text-sm text-muted-foreground mb-2">Upload video/audio file</p>
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Attributes</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Trait type"
                value={newAttribute.trait_type}
                onChange={(e) => setNewAttribute({ ...newAttribute, trait_type: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
              />
              <Button type="button" onClick={addAttribute} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attributes.map((attr, index) => (
                <Badge key={index} variant="secondary" className="gap-2">
                  {attr.trait_type}: {attr.value}
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Pricing & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mint Price (ETH)</label>
              <Input 
                type="number" 
                step="0.001" 
                value={formData.mint_price || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  mint_price: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Royalty %</label>
              <Input 
                type="number" 
                step="0.1" 
                max="100"
                value={formData.royalty_percentage}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  royalty_percentage: parseFloat(e.target.value) || 0 
                })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">External URL</label>
              <Input 
                placeholder="https://..." 
                value={formData.external_url}
                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Creating...' : 'Create NFT'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};