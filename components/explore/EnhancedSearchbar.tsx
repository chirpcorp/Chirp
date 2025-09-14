"use client";

import React, { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import Image from "next/image";
import Link from "next/link";

import { Input } from "../ui/input";
import { fetchUsers } from "@/lib/actions/user.actions";
import { fetchChirpsByHashtag } from "@/lib/actions/chirp.actions";

interface Props {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

interface SearchResult {
  users: any[];
  hashtags: any[];
}

export default function EnhancedSearchbar({ 
  placeholder = "Search users, hashtags, or topics...",
  onSearch 
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search function - waits 500ms after user stops typing
  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], hashtags: [] });
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      // Search users and hashtags in parallel
      const [userResults, hashtagResults] = await Promise.all([
        // Search users
        fetchUsers({
          userId: "dummy", // This will be filtered out in the backend
          searchString: searchQuery,
          pageSize: 5
        }),
        // Search hashtags (if query starts with #)
        searchQuery.startsWith('#') 
          ? fetchChirpsByHashtag(searchQuery.slice(1))
          : Promise.resolve({ chirps: [] })
      ]);

      // Properly serialize the results to avoid toJSON errors
      const serializedUsers = (userResults.users || []).map((user: any) => ({
        _id: user._id?.toString() || user._id,
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image || '/assets/user.svg',
        bio: user.bio
      }));

      const serializedHashtags = hashtagResults.chirps ? [
        { 
          hashtag: searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery, 
          posts: hashtagResults.chirps.map((chirp: any) => ({
            _id: chirp._id?.toString() || chirp._id,
            text: chirp.text
          }))
        }
      ] : [];

      setResults({
        users: serializedUsers,
        hashtags: serializedHashtags
      });
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults({ users: [], hashtags: [] });
    } finally {
      setLoading(false);
    }
  }, 500); // 500ms delay

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Trigger debounced search
    debouncedSearch(value);
    
    // Call external onSearch if provided
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-container relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Image
            src="/assets/search-gray.svg"
            alt="search"
            width={20}
            height={20}
            className="object-contain text-gray-1"
          />
        </div>
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full rounded-full border-dark-4 bg-dark-3 py-3 pl-12 pr-10 text-light-1 placeholder-gray-1 transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <div className="size-5 animate-spin rounded-full border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && (query.trim() !== '') && (results.users.length > 0 || results.hashtags.length > 0) && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-dark-4 bg-dark-2 shadow-lg">
          {/* Users Section */}
          {results.users.length > 0 && (
            <div className="p-3">
              <h3 className="mb-2 text-small-semibold text-gray-1">People</h3>
              {results.users.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-dark-3"
                  onClick={() => setShowDropdown(false)}
                >
                  <Image
                    src={user.image || '/assets/user.svg'}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-semibold text-light-1">
                      {user.name}
                    </p>
                    <p className="truncate text-small-regular text-gray-1">
                      @{user.username}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Hashtags Section */}
          {results.hashtags.length > 0 && (
            <div className="border-t border-dark-4 p-3">
              <h3 className="mb-2 text-small-semibold text-gray-1">Topics</h3>
              {results.hashtags.map((item, index) => (
                <Link
                  key={index}
                  href={`/hashtag/${item.hashtag}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-dark-3"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary-500">
                    <span className="text-sm font-bold text-white">#</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-semibold text-light-1">
                      #{item.hashtag}
                    </p>
                    <p className="text-small-regular text-gray-1">
                      {item.posts?.length || 0} posts
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* No results */}
          {results.users.length === 0 && results.hashtags.length === 0 && !loading && (
            <div className="p-6 text-center">
              <p className="text-gray-1">No results found for &quot;{query}&quot;</p>
              <p className="mt-1 text-small-regular text-gray-1">
                Try searching for people, hashtags, or topics
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}