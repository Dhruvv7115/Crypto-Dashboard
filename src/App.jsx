import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, TrendingUp, TrendingDown, DollarSign, Search, Filter, ChevronDown, X } from 'lucide-react';

const CryptoDashboard = () => {
  const [coins, setCoins] = useState([]);
  const [favourites, setFavourites] = useState(JSON.parse(localStorage.getItem("favourites")) || []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('usd');
  const [marketCapFilter, setMarketCapFilter] = useState('all');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [priceHistory, setPriceHistory] = useState({});
  const [selectedCoin, setSelectedCoin] = useState(null);

  const currencies = {
    usd: { symbol: '$', name: 'USD' },
    eur: { symbol: '€', name: 'EUR' },
    inr: { symbol: '₹', name: 'INR'},
    gbp: { symbol: '£', name: 'GBP' },
    jpy: { symbol: '¥', name: 'JPY' },
    btc: { symbol: '₿', name: 'BTC' },
    eth: { symbol: 'Ξ', name: 'ETH' }
  };

  const marketCapRanges = {
    all: 'All Market Caps',
    large: 'Large Cap (>$10B)',
    mid: 'Mid Cap ($1B-$10B)',
    small: 'Small Cap (<$1B)'
  };

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCurrency]);

  const fetchCoins = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${selectedCurrency}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d`
      );
      const data = await response.json();
      setCoins(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coins:', error);
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (coinId) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${selectedCurrency}&days=7`
      );
      const data = await response.json();
      
      const formattedData = data.prices.map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleDateString(),
        price: price
      }));

      setPriceHistory(prev => ({
        ...prev,
        [coinId]: formattedData
      }));
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };
  const saveFavouritesToLocalStorage = (favs) => {
    localStorage.setItem("favourites", JSON.stringify(favs));
  }

  const togglefavourite = (coinId) => {
    setFavourites(prev => {
      let updated = prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
      saveFavouritesToLocalStorage(updated);
      return updated;
    });
  };

  const getMarketCapCategory = (marketCap) => {
    if (marketCap > 10000000000) return 'large';
    if (marketCap > 1000000000) return 'mid';
    return 'small';
  };

  const filteredCoins = useMemo(() => {
    let filtered = coins.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMarketCap = marketCapFilter === 'all' || 
                              getMarketCapCategory(coin.market_cap) === marketCapFilter;
      
      return matchesSearch && matchesMarketCap;
    });

    // Sort coins
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'price_change_percentage_24h') {
        aValue = a.price_change_percentage_24h || 0;
        bValue = b.price_change_percentage_24h || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [coins, searchTerm, marketCapFilter, sortBy, sortOrder]);

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return price.toFixed(6);
    }
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    }
    return marketCap?.toLocaleString();
  };

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin);
    if (!priceHistory[coin.id]) {
      fetchPriceHistory(coin.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading cryptocurrency data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Crypto Dashboard
          </h1>
          <p className="text-gray-400">Real-time cryptocurrency prices and market data</p>
        </div>

        {/* Controls */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Currency Selection */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 pr-10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500  w-full appearance-none cursor-pointer"
            >
              {Object.entries(currencies).map(([code, curr]) => (
                <option key={code} value={code}>{curr.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute top-2 right-2 pointer-events-none" />
          </div>
          

          {/* Market Cap Filter */}
          <div className="relative">
            <select
              value={marketCapFilter}
              onChange={async(e) => {
                await fetchCoins(e.target.value)
                setMarketCapFilter(e.target.value)
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none w-full"
            >
              {Object.entries(marketCapRanges).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute top-2 right-2 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none w-full"
            >
              <option value="market_cap-desc">Market Cap (High to Low)</option>
              <option value="market_cap-asc">Market Cap (Low to High)</option>
              <option value="current_price-desc">Price (High to Low)</option>
              <option value="current_price-asc">Price (Low to High)</option>
              <option value="price_change_percentage_24h-desc">24h Change (High to Low)</option>
              <option value="price_change_percentage_24h-asc">24h Change (Low to High)</option>
            </select>
            <ChevronDown className="absolute top-2 right-2 pointer-events-none" />
          </div>
        </div>

        {/* Favourites Section */}
        {favourites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Star className="h-6 w-6 text-yellow-400 mr-2" />
              Favourites
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coins.filter(coin => favourites.includes(coin.id)).map(coin => (
                <div key={coin.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 cursor-pointer" onClick={() => handleCoinClick(coin)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-3" />
                      <div>
                        <h3 className="font-semibold">{coin.name}</h3>
                        <p className="text-gray-400 text-sm">{coin.symbol.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglefavourite(coin.id)
                      }}
                      className="text-yellow-400 hover:text-yellow-300 "
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold">
                      {currencies[selectedCurrency].symbol}{formatPrice(coin.current_price)}
                    </p>
                    <div className={`flex items-center ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.price_change_percentage_24h >= 0 ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      <span>{Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Coins Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Coin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">24h Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">7d Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Market Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chart (7d)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredCoins.map((coin) => (
                  <tr 
                    key={coin.id} 
                    className="hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleCoinClick(coin)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {coin.market_cap_rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-white">{coin.name}</div>
                          <div className="text-sm text-gray-400">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {currencies[selectedCurrency].symbol}{formatPrice(coin.current_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.price_change_percentage_24h >= 0 ? 
                          <TrendingUp className="h-4 w-4 mr-1" /> : 
                          <TrendingDown className="h-4 w-4 mr-1" />
                        }
                        <span>{(coin.price_change_percentage_24h || 0).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${coin.price_change_percentage_7d_in_currency >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.price_change_percentage_7d_in_currency >= 0 ? 
                          <TrendingUp className="h-4 w-4 mr-1" /> : 
                          <TrendingDown className="h-4 w-4 mr-1" />
                        }
                        <span>{(coin.price_change_percentage_7d_in_currency || 0).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${formatMarketCap(coin.market_cap)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coin.sparkline_in_7d && (
                        <div className="w-24 h-12">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={coin.sparkline_in_7d.price.map((price, index) => ({ price, index }))}>
                              <Line 
                                type="monotone" 
                                dataKey="price" 
                                stroke={coin.price_change_percentage_7d_in_currency >= 0 ? '#10B981' : '#EF4444'} 
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglefavourite(coin.id);
                        }}
                        className={`${favourites.includes(coin.id) ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-300 transition-colors`}
                      >
                        <Star className={`h-5 w-5 cursor-pointer ${favourites.includes(coin.id) ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Chart Model */}
        {selectedCoin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <img src={selectedCoin.image} alt={selectedCoin.name} className="w-12 h-12 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCoin.name}</h2>
                    <p className="text-gray-400">{selectedCoin.symbol.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCoin(null)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  <X className="font-extrabold"/>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Current Price</p>
                  <p className="text-xl font-bold">
                    {currencies[selectedCurrency].symbol}{formatPrice(selectedCoin.current_price)}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Market Cap</p>
                  <p className="text-lg font-semibold">
                    {currencies[selectedCurrency].symbol}{formatMarketCap(selectedCoin.market_cap)}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">24h High</p>
                  <p className="text-lg font-semibold">
                    {currencies[selectedCurrency].symbol}{formatPrice(selectedCoin.high_24h)}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">24h Low</p>
                  <p className="text-lg font-semibold">
                    {currencies[selectedCurrency].symbol}{formatPrice(selectedCoin.low_24h)}
                  </p>
                </div>
              </div>

              {priceHistory[selectedCoin.id] && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-4">7-Day Price Chart</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory[selectedCoin.id]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3B82F6" 
                          strokeWidth={5}
                          dot={{ fill: '#3B82F6', strokeWidth: 1, r: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoDashboard;