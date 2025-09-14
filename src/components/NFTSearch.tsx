import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { useNFTManagement, NFTSearchFilters } from '@/hooks/useNFTManagement';
import { NFTCard } from './NFTCard';

export const NFTSearch = () => {
  const { nfts, searchNFTs, loading } = useNFTManagement();
  const [filters, setFilters] = useState<NFTSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    searchNFTs({ ...filters, search: searchTerm });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search NFTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Select value={filters.blockchain} onValueChange={(value) => setFilters({ ...filters, blockchain: value })}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Blockchains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Blockchains</SelectItem>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="polygon">Polygon</SelectItem>
            <SelectItem value="solana">Solana</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
};