'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationIQAutocompleteProps {
  onSelectAddress: (address: string, lat: number | null, lng: number | null) => void;
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationIQAutocomplete({ onSelectAddress }: LocationIQAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Busca na API do LocationIQ ou simulação local caso não haja token
  const handleSearch = async (value: string) => {
    if (value.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    const token = process.env.NEXT_PUBLIC_LOCATIONIQ_TOKEN;

    if (token) {
      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${token}&q=${encodeURIComponent(
            value
          )}&limit=5&format=json&lang=pt`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Resultados simulados para teste local imediato sem chave
      setTimeout(() => {
        setResults([
          {
            place_id: '1',
            display_name: `${value} - Av. Paulista, 1000 - Bela Vista, São Paulo - SP`,
            lat: '-23.561414',
            lon: '-46.655881',
          },
          {
            place_id: '2',
            display_name: `${value} - Rua Augusta, 500 - Consolação, São Paulo - SP`,
            lat: '-23.553221',
            lon: '-46.650831',
          },
        ]);
        setShowDropdown(true);
        setIsLoading(false);
      }, 300);
    }
  };

  const handleSelect = (item: SearchResult) => {
    setQuery(item.display_name);
    setShowDropdown(false);
    onSelectAddress(
      item.display_name,
      parseFloat(item.lat),
      parseFloat(item.lon)
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    // Notifica o formulário do texto atual para liberar o botão "Salvar"
    onSelectAddress(val, null, null);
    handleSearch(val);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          placeholder="Digite a rua, número ou bairro..."
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition outline-none text-slate-900"
        />
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 text-indigo-600 animate-spin" />
        )}
      </div>

      {/* Menu suspenso de sugestões */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
          {results.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full p-3 text-left hover:bg-slate-50 transition flex items-start gap-2 text-xs text-slate-700"
            >
              <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}