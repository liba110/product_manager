import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    // Handle preflight requests
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await req.text(); // Read the raw body as text
    const { action, productId, data } = body ? JSON.parse(body) : {}; // Parse only if body exists

    if (!action) {
      console.error("Invalid request: 'action' is missing");
      return new Response(JSON.stringify({ error: "'action' is required" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (action === "fetch") {
      // Fetch all product data except image_url for listing
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, progress, categories, updated_at")
        .limit(1000); // Fetch up to 1000 products

      if (error) throw error;
      // Only log product names
      console.log('Supabase products:', products.map(p => p.name));
      return new Response(JSON.stringify(products), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (action === "fetchImage") {
      // Fetch only image_url for a specific product
      const { data: product, error } = await supabase
        .from("products")
        .select("image_url")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(product), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (action === "edit") {
      const { error } = await supabase
        .from("products")
        .update(data)
        .eq("id", productId);

      if (error) throw error;
      return new Response("Product updated successfully", { status: 200 });
    }

    if (action === "increaseProgress") {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("progress, categories")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;

      const newProgress = (product.progress || 0) + 1;

      // Update categories if needed
      const updatedCategories = product.categories.map((category: any) => ({
        ...category,
        completed: category.completed || false, // Ensure `completed` field exists
      }));

      const { error: updateError } = await supabase
        .from("products")
        .update({ progress: newProgress, categories: updatedCategories })
        .eq("id", productId);

      if (updateError) throw updateError;

      return new Response("Progress and categories updated successfully", { status: 200 });
    }

    return new Response("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Unknown error" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});