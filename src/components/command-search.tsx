"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Home, LogIn, Search, Wand2, BookOpen } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchResult = {
  slug: string;
  title: string;
  summary: string;
  trustScore: number;
  status: string;
};

type CommandContextValue = {
  open: () => void;
  close: () => void;
};

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searchArticles = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/articles/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data ?? []);
      }
    } catch {
      // ignore search errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void searchArticles(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchArticles]);

  const navigate = useCallback(
    (href: string) => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      router.push(href);
    },
    [router]
  );

  const value: CommandContextValue = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => {
        setIsOpen(false);
        setQuery("");
        setResults([]);
      },
    }),
    []
  );

  return (
    <CommandContext.Provider value={value}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search articles, topics..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length >= 2 && results.length === 0 && !isLoading && (
            <CommandEmpty>
              <p className="text-sm text-muted-foreground">No articles found for &ldquo;{query}&rdquo;</p>
            </CommandEmpty>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Articles">
              {results.map((article) => (
                <CommandItem
                  key={article.slug}
                  value={article.title}
                  onSelect={() => navigate(`/articles/${article.slug}`)}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{article.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {article.summary}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {article.trustScore}/100
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {query.trim().length >= 2 && !isLoading && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Generate new topic">
                <CommandItem
                  value={`generate-${query}`}
                  onSelect={() =>
                    navigate(
                      `/articles/${query.trim().toLowerCase().replace(/\s+/g, "-")}?from=search`
                    )
                  }
                >
                  <Wand2 className="mr-2 h-4 w-4 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Generate &ldquo;{query.trim()}&rdquo;</p>
                    <p className="text-xs text-muted-foreground">
                      Lumi will create an evidence-based article on this topic
                    </p>
                  </div>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Quick links">
            <CommandItem onSelect={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </CommandItem>
            <CommandItem onSelect={() => navigate("/topics")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Browse topics
            </CommandItem>
            <CommandItem onSelect={() => navigate("/signin")}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandContext.Provider>
  );
}

export function CommandSearchButton() {
  const context = useContext(CommandContext);
  if (!context) return null;

  return (
    <Button
      variant="outline"
      onClick={context.open}
      className="relative w-full justify-start gap-2 text-sm text-muted-foreground md:w-auto"
    >
      <Search className="h-4 w-4" />
      <span className="hidden lg:inline-flex">Search articles...</span>
      <span className="lg:hidden">Search</span>
      <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>
    </Button>
  );
}
