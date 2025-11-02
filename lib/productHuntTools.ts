import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Helper function to call Product Hunt GraphQL API
async function callProductHuntAPI(query: string) {
  const DEVELOPER_TOKEN = process.env.PRODUCTHUNT_TOKEN;
  
  if (!DEVELOPER_TOKEN) {
    throw new Error('PRODUCTHUNT_TOKEN not configured');
  }
  
  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${DEVELOPER_TOKEN}`
    },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }
  
  return data;
}

// Tool 1: Get trending products
export const getTrendingProductsTool = new DynamicStructuredTool({
  name: "get_trending_products",
  description: "Get today's top trending products from Product Hunt. Use this when user asks about popular, hot, trending, or top products.",
  schema: z.object({
    limit: z.number().optional().default(10).describe("Number of products to fetch"),
  }),
  func: async ({ limit }) => {
    try {
      const query = `{
        posts(first: ${limit}, order: RANKING) {
          edges {
            node {
              id
              name
              tagline
              votesCount
              commentsCount
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }`;
      
      const data = await callProductHuntAPI(query);
      
      const products = data.data?.posts?.edges?.map((edge: any) => ({
        name: edge.node.name,
        tagline: edge.node.tagline,
        votes: edge.node.votesCount,
        commentsCount: edge.node.commentsCount,
        topics: edge.node.topics?.edges?.map((t: any) => t.node.name) || []
      })) || [];
      
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
      // Get more products to filter through
      const query = `{
        posts(first: 20, order: RANKING) {
          edges {
            node {
              id
              name
              tagline
              description
              votesCount
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }`;
      
      const data = await callProductHuntAPI(query);
      
      // Filter products based on keywords
      const keywordLower = keywords.toLowerCase();
      const filteredProducts = data.data?.posts?.edges?.filter((edge: any) => {
        const node = edge.node;
        const searchText = `${node.name} ${node.tagline} ${node.description || ''} ${node.topics?.edges?.map((t: any) => t.node.name).join(' ') || ''}`.toLowerCase();
        return searchText.includes(keywordLower);
      }).slice(0, limit);
      
      if (filteredProducts.length === 0) {
        return `No products found for keywords: ${keywords}`;
      }
      
      const products = filteredProducts.map((edge: any) => ({
        name: edge.node.name,
        tagline: edge.node.tagline,
        votes: edge.node.votesCount,
        topics: edge.node.topics?.edges?.map((t: any) => t.node.name) || []
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
      // Get products with comments
      const query = `{
        posts(first: 10, order: RANKING) {
          edges {
            node {
              id
              name
              tagline
              description
              votesCount
              website
              slug
              commentsCount
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
              makers {
                name
                headline
              }
              comments(first: 10) {
                edges {
                  node {
                    body
                    votesCount
                    user {
                      name
                      headline
                    }
                  }
                }
              }
            }
          }
        }
      }`;
      
      const data = await callProductHuntAPI(query);
      
      // Find the product by name
      const product = data.data?.posts?.edges?.find((edge: any) => 
        edge.node.name.toLowerCase().includes(productName.toLowerCase())
      );
      
      if (!product) {
        return `Product "${productName}" not found in today's products`;
      }
      
      const node = product.node;
      return JSON.stringify({
        name: node.name,
        tagline: node.tagline,
        description: node.description,
        votes: node.votesCount,
        website: node.website,
        topics: node.topics?.edges?.map((t: any) => t.node.name) || [],
        makers: node.makers || [],
        commentsCount: node.commentsCount,
        comments: node.comments?.edges?.map((c: any) => ({
          text: c.node.body,
          votes: c.node.votesCount,
          author: c.node.user?.name || 'Anonymous'
        })) || []
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
    
    // Simple sentiment analysis
    const positiveKeywords = ['love', 'great', 'excellent', 'amazing', 'fantastic', 'useful', 'helpful', 'brilliant', 'recommend', 'best', 'awesome'];
    const negativeKeywords = ['hate', 'bad', 'poor', 'terrible', 'useless', 'waste', 'disappointed', 'frustrating', 'worst', 'avoid'];
    
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

// Export all tools
export const productHuntTools = [
  getTrendingProductsTool,
  searchProductsTool,
  getProductDetailsTool,
  analyzeCommentsTool
];
