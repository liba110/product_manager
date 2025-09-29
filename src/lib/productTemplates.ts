export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  tasks: ChecklistItem[];
  subSections?: {
    [key: string]: {
      name: string;
      tasks: ChecklistItem[];
    };
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

export const defaultProductCategories: TaskCategory[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛒',
    tasks: [],
    subSections: {
      images: {
        name: 'Images',
        tasks: [
          { id: 'img1', label: 'Product Photography', description: 'High-quality product photos from multiple angles', completed: false },
          { id: 'img2', label: 'Lifestyle Images', description: 'Images showing product in use/context', completed: false },
          { id: 'img3', label: 'Detail Shots', description: 'Close-up shots of key features', completed: false },
          { id: 'img4', label: 'Image Optimization', description: 'Optimize images for web', completed: false }
        ]
      },
      description: {
        name: 'Description',
        tasks: [
          { id: 'desc1', label: 'Product Title', description: 'Compelling and SEO-friendly product title', completed: false },
          { id: 'desc2', label: 'Product Description', description: 'Detailed product description with benefits', completed: false },
          { id: 'desc3', label: 'Key Features List', description: 'Bullet points of main features', completed: false },
          { id: 'desc4', label: 'SEO Meta Description', description: 'Search engine description', completed: false }
        ]
      },
      fields: {
        name: 'Fields',
        tasks: [
          { id: 'field1', label: 'Dimensions', description: 'Product dimensions and specifications', completed: false }
        ]
      },
      links: {
        name: 'Links',
        tasks: [
          { id: 'link1', label: 'Supplier Links', description: 'Links to supplier information', completed: false }
        ]
      }
    }
  },
  {
    id: 'others',
    name: 'Others',
    icon: '🌐',
    tasks: [
      { id: '11', label: 'Amazon Listing', description: 'Create Amazon product listing', completed: false },
      { id: '12', label: 'eBay Listing', description: 'List product on eBay', completed: false },
      { id: '13', label: 'Etsy Listing', description: 'Create Etsy shop listing', completed: false },
      { id: '14', label: 'Facebook Marketplace', description: 'Post on Facebook Marketplace', completed: false },
      { id: '15', label: 'Google Shopping', description: 'Submit to Google Shopping', completed: false },
      { id: '16', label: 'Pinterest Catalog', description: 'Add to Pinterest business catalog', completed: false },
      { id: '17', label: 'Instagram Shopping', description: 'Tag product in Instagram posts', completed: false },
      { id: '18', label: 'TikTok Shop', description: 'List on TikTok Shop if applicable', completed: false }
    ]
  },
  {
    id: 'placement',
    name: 'Placement',
    icon: '📍',
    tasks: [
      { id: '19', label: 'Website Homepage', description: 'Feature on main website homepage', completed: false },
      { id: '20', label: 'Category Pages', description: 'Add to relevant category pages', completed: false },
      { id: '21', label: 'Featured Products', description: 'Include in featured products section', completed: false },
      { id: '22', label: 'Related Products', description: 'Set up related product suggestions', completed: false },
      { id: '23', label: 'Cross-sell Setup', description: 'Configure cross-selling opportunities', completed: false },
      { id: '24', label: 'Upsell Configuration', description: 'Set up upselling options', completed: false },
      { id: '25', label: 'Search Results', description: 'Optimize for internal search', completed: false },
      { id: '26', label: 'Navigation Menu', description: 'Add to appropriate menu categories', completed: false }
    ]
  },
  {
    id: 'wholesale',
    name: 'Wholesale',
    icon: '📦',
    tasks: [
      { id: '27', label: 'Wholesale Pricing', description: 'Set up tiered wholesale pricing', completed: false },
      { id: '28', label: 'Minimum Order Qty', description: 'Define minimum order quantities', completed: false },
      { id: '29', label: 'Wholesale Portal', description: 'Add to wholesale customer portal', completed: false },
      { id: '30', label: 'Trade Show Materials', description: 'Prepare trade show presentation', completed: false },
      { id: '31', label: 'Wholesale Catalog', description: 'Include in wholesale catalog', completed: false },
      { id: '32', label: 'B2B Platform Listing', description: 'List on B2B marketplaces', completed: false },
      { id: '33', label: 'Distributor Outreach', description: 'Contact potential distributors', completed: false },
      { id: '34', label: 'Bulk Shipping', description: 'Configure bulk shipping options', completed: false }
    ]
  },
  {
    id: 'visibility',
    name: 'Visibility',
    icon: '👁️',
    tasks: [
      { id: '35', label: 'Social Media Posts', description: 'Create social media content', completed: false },
      { id: '36', label: 'Email Newsletter', description: 'Feature in email campaigns', completed: false },
      { id: '37', label: 'Blog Content', description: 'Write blog post about product', completed: false },
      { id: '38', label: 'Press Release', description: 'Draft press release if newsworthy', completed: false },
      { id: '39', label: 'Influencer Outreach', description: 'Contact relevant influencers', completed: false },
      { id: '40', label: 'Customer Reviews', description: 'Encourage and manage reviews', completed: false },
      { id: '41', label: 'Video Content', description: 'Create product demonstration video', completed: false },
      { id: '42', label: 'Paid Advertising', description: 'Set up targeted ad campaigns', completed: false }
    ]
  }
];