import { ref, onMounted, onUnmounted, type Ref } from 'vue';

interface UseInfiniteScrollOptions {
  /** Distance from bottom (in px) to trigger load more */
  threshold?: number;
  /** The scrollable container element. Defaults to window */
  container?: Ref<HTMLElement | null>;
  /** Whether infinite scroll is enabled */
  enabled?: Ref<boolean>;
}

/**
 * Composable for infinite scroll functionality
 * 
 * @example
 * ```ts
 * const galleryRef = ref(null);
 * const { loadMore, hasMore, loadingMore } = galleryRef.value;
 * 
 * useInfiniteScroll({
 *   onLoadMore: () => galleryRef.value?.loadMore(),
 *   canLoadMore: () => galleryRef.value?.hasMore ?? false,
 *   isLoading: () => galleryRef.value?.loadingMore ?? false
 * });
 * ```
 */
export function useInfiniteScroll(
  callbacks: {
    onLoadMore: () => void | Promise<void>;
    canLoadMore: () => boolean;
    isLoading: () => boolean;
  },
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 200, container, enabled } = options;
  const isScrolling = ref(false);
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleScroll = () => {
    // Check if enabled
    if (enabled?.value === false) return;
    
    // Debounce scroll events
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(async () => {
      // Don't load if already loading or no more items
      if (callbacks.isLoading() || !callbacks.canLoadMore()) return;
      
      let scrollTop: number;
      let scrollHeight: number;
      let clientHeight: number;
      
      if (container?.value) {
        scrollTop = container.value.scrollTop;
        scrollHeight = container.value.scrollHeight;
        clientHeight = container.value.clientHeight;
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      }
      
      // Check if near bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      if (distanceFromBottom < threshold) {
        await callbacks.onLoadMore();
      }
    }, 100);
  };

  onMounted(() => {
    const target = container?.value || window;
    target.addEventListener('scroll', handleScroll, { passive: true });
  });

  onUnmounted(() => {
    const target = container?.value || window;
    target.removeEventListener('scroll', handleScroll);
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });

  return {
    isScrolling
  };
}

/**
 * Simple hook to detect when element is near viewport bottom
 * Uses Intersection Observer for better performance
 */
export function useIntersectionTrigger(
  triggerRef: Ref<HTMLElement | null>,
  callback: () => void | Promise<void>,
  options: {
    enabled?: Ref<boolean>;
    rootMargin?: string;
  } = {}
) {
  const { enabled, rootMargin = '200px' } = options;
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!triggerRef.value) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        if (enabled?.value === false) return;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        rootMargin,
        threshold: 0
      }
    );
    
    observer.observe(triggerRef.value);
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });
}
