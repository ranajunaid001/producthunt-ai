import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Tool 1: Get trending products (no comments needed)
export const getTrendingProductsTool = new DynamicStructuredTool({
  name: "get_trending_products",
  description: "Get today's top trending products from Product Hunt. Use this when user asks about popular, hot, trending, or top products.",
  schema: z.object({
    limit: z.number().optional().default(10).describe("Number of products to fetch"),
  }),
  func: async ({ limit }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/producthunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productCount: limit })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      // Return simplified data for the agent
      const products = data.products.map((p: any) => ({
        name: p.name,
        tagline: p.tagline,
        votes: p.votesCount,
        commentsCount: p.commentsCount,
        topics: p.topics
      }));
      
      return JSON.stringify(products);
    } catch (error) {
      return `Error fetching products: ${error.message}`;
    }
  },
});

// Tool 2: Search products by category/keyword
export const searchProductsTool = new DynamicStructuredTool({
  name: "search_products",
  description: "Search for products by keywords or categories. Use this when user asks about specific types of products like 'AI tools', 'video editors', 'legal tech', etc.",
  schema: z.object({
    keywords: z.string().describe("Search keywords or categories like 'AI', 'video', 'legal', 'productivity'"),
    limit: z.number().optional().default(5).describe("Number of products to return"),
  }),
  func: async ({ keywords, limit }) => {
    try {
      // First get all products, then filter
      // In a real implementation, you'd modify the GraphQL query to search
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/producthunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productCount: 20 }) // Get more to filter from
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      // Filter products based on keywords
      const keywordLower = keywords.toLowerCase();
      const filteredProducts = data.products.filter((p: any) => {
        const searchText = `${p.name} ${p.tagline} ${p.description} ${p.topics.join(' ')}`.toLowerCase();
        return searchText.includes(keywordLower);
      }).slice(0, limit);
      
      if (filteredProducts.length === 0) {
        return `No products found for keywords: ${keywords}`;
      }
      
      const products = filteredProducts.map((p: any) => ({
        name: p.name,
        tagline: p.tagline,
        votes: p.votesCount,
        topics: p.topics
      }));
      
      return JSON.stringify(products);
    } catch (error) {
      return `Error searching products: ${error.message}`;
    }
  },
});

// Tool 3: Get detailed product info with comments
export const getProductDetailsTool = new DynamicStructuredTool({
  name: "get_product_details",
  description: "Get detailed information about a specific product including user comments. Use this when user asks what people think about a product or wants detailed feedback.",
  schema: z.object({
    productName: z.string().describe("The name of the product to get details for"),
  }),
  func: async ({ productName }) => {
    try {
      // First get products to find the specific one
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/producthunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productCount: 10 })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      // Find the product by name (case insensitive)
      const product = data.products.find((p: any) => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      );
      
      if (!product) {
        return `Product "${productName}" not found in today's products`;
      }
      
      // Return detailed info including comments
      return JSON.stringify({
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        votes: product.votesCount,
        website: product.website,
        topics: product.topics,
        makers: product.makers,
        commentsCount: product.commentsCount,
        comments: product.comments.map((c: any) => ({
          text: c.body,
          votes: c.votes,
          author: c.author
        }))
      });
    } catch (error) {
      return `Error fetching product details: ${error.message}`;
    }
  },
});

// Tool 4: Analyze sentiment from comments
export const analyzeCommentsTool = new DynamicStructuredTool({
  name: "analyze_comments",
  description: "Analyze sentiment and themes from product comments. Use this after getting product details to understand what users like/dislike.",
  schema: z.object({
    comments: z.array(z.object({
      text: z.string(),
      votes: z.number(),
    })).describe("Array of comments to analyze"),
    productName: z.string().describe("Name of the product for context"),
  }),
  func: async ({ comments, productName }) => {
    if (!comments || comments.length === 0) {
      return "No comments to analyze";
    }
    
    // Group comments by sentiment based on content
    const positiveKeywords = ['love', 'great', 'excellent', 'amazing', 'fantastic', 'useful', 'helpful', 'brilliant', 'recommend'];
    const negativeKeywords = ['hate', 'bad', 'poor', 'terrible', 'useless', 'waste', 'disappointed', 'frustrating'];
    
    const analysis = {
      totalComments: comments.length,
      highlyVotedComments: comments.filter(c => c.votes > 5).map(c => c.text),
      themes: {
        positive: [] as string[],
        negative: [] as string[],
        neutral: [] as string[]
      }
    };
    
    comments.forEach(comment => {
      const textLower = comment.text.toLowerCase();
      const hasPositive = positiveKeywords.some(keyword => textLower.includes(keyword));
      const hasNegative = negativeKeywords.some(keyword => textLower.includes(keyword));
      
      if (hasPositive && !hasNegative) {
        analysis.themes.positive.push(comment.text);
      } else if (hasNegative && !hasPositive) {
        analysis.themes.negative.push(comment.text);
      } else {
        analysis.themes.neutral.push(comment.text);
      }
    });
    
    return JSON.stringify({
      product: productName,
      analysis: {
        totalComments: analysis.totalComments,
        sentiment: {
          positive: analysis.themes.positive.length,
          negative: analysis.themes.negative.length,
          neutral: analysis.themes.neutral.length
        },
        topComments: analysis.highlyVotedComments.slice(0, 3),
        summary: `${analysis.themes.positive.length} positive, ${analysis.themes.negative.length} negative, ${analysis.themes.neutral.length} neutral comments`
      }
    });
  },
});

// Export all tools as an array
export const productHuntTools = [
  getTrendingProductsTool,
  searchProductsTool,
  getProductDetailsTool,
  analyzeCommentsTool
];
