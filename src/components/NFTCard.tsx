import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Eye } from 'lucide-react';
import { useNFTManagement } from '@/hooks/useNFTManagement';
import type { Database } from '@/integrations/supabase/types';

interface NFTCardProps {
  nft: Database['public']['Tables']['nft_tokens']['Row'];
  onView?: (nft: Database['public']['Tables']['nft_tokens']['Row']) => void;
}

export const NFTCard = ({ nft, onView }: NFTCardProps) => {
  const { toggleLike, incrementViewCount } = useNFTManagement();

  const handleView = () => {
    incrementViewCount(nft.id);
    onView?.(nft);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(nft.id);
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleView}>
      <CardHeader className="p-0">
        {nft.image_file_id && (
          <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
            <span className="text-muted-foreground">NFT Image</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg truncate">{nft.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {nft.blockchain}
          </Badge>
        </div>
        
        {nft.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {nft.description}
          </p>
        )}

        {nft.current_price && (
          <p className="font-semibold mb-3">
            {nft.current_price} ETH
          </p>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {nft.view_count || 0}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="flex items-center gap-1 p-0 h-auto"
            >
              <Heart className="w-4 h-4" />
              {nft.like_count || 0}
            </Button>
          </div>
          
          {nft.is_minted && (
            <Badge variant="secondary">Minted</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};