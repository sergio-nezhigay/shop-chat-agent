/**
 * Tool Service
 * Manages tool execution and processing
 */
import { saveMessage } from "../db.server";
import AppConfig from "./config.server";

/**
 * Creates a tool service instance
 * @returns {Object} Tool service with methods for managing tools
 */
export function createToolService() {
  /**
   * Handles a tool error response
   * @param {Object} toolUseResponse - The error response from the tool
   * @param {string} toolName - The name of the tool
   * @param {string} toolUseId - The ID of the tool use request
   * @param {Array} conversationHistory - The conversation history
   * @param {Function} sendMessage - Function to send messages to the client
   * @param {string} conversationId - The conversation ID
   */
  const handleToolError = async (toolUseResponse, toolName, toolUseId, conversationHistory, sendMessage, conversationId) => {
    if (toolUseResponse.error.type === "auth_required") {
      console.log("Auth required for tool:", toolName);
      await addToolResultToHistory(conversationHistory, toolUseId, toolUseResponse.error.data, conversationId);
      sendMessage({ type: 'auth_required' });
    } else {
      console.log("Tool use error", toolUseResponse.error);
      await addToolResultToHistory(conversationHistory, toolUseId, toolUseResponse.error.data, conversationId);
    }
  };

  /**
   * Handles a successful tool response
   * @param {Object} toolUseResponse - The response from the tool
   * @param {string} toolName - The name of the tool
   * @param {string} toolUseId - The ID of the tool use request
   * @param {Array} conversationHistory - The conversation history
   * @param {Array} productsToDisplay - Array to add product results to
   * @param {string} conversationId - The conversation ID
   * @param {Array} cartActionsToDisplay - Array to add real-cart write instructions to
   */
  const handleToolSuccess = async (toolUseResponse, toolName, toolUseId, conversationHistory, productsToDisplay, conversationId, cartActionsToDisplay = []) => {
    let contentForHistory = toolUseResponse.content;

    // Check if this is a product search result
    if (toolName === AppConfig.tools.productSearchName) {
      const allFormattedProducts = formatAllProductsFromResult(toolUseResponse);
      productsToDisplay.push(...allFormattedProducts.slice(0, AppConfig.tools.maxProductsToDisplay));

      // Give Claude a corrected, deterministic price string for every product
      // actually present in the raw response, so it never has to convert
      // minor-unit amounts itself.
      contentForHistory = appendPriceSummaryBlock(toolUseResponse.content, allFormattedProducts);
    }

    // add_to_cart doesn't write to Shopify itself; it hands back a variant/quantity
    // pair the client must submit to the storefront's real AJAX Cart API.
    if (toolName === "add_to_cart" && toolUseResponse.cart_action) {
      cartActionsToDisplay.push(toolUseResponse.cart_action);
    }

    addToolResultToHistory(conversationHistory, toolUseId, contentForHistory, conversationId);
  };

  /**
   * Parses and formats every product from a search_catalog tool response,
   * with no slicing.
   * @param {Object} toolUseResponse - The response from the tool
   * @returns {Array} All formatted products (unsliced)
   */
  const formatAllProductsFromResult = (toolUseResponse) => {
    try {
      if (!toolUseResponse.content || toolUseResponse.content.length === 0) {
        return [];
      }

      const content = toolUseResponse.content[0].text;
      let responseData;
      if (typeof content === 'object') {
        responseData = content;
      } else if (typeof content === 'string') {
        responseData = JSON.parse(content);
      }

      if (responseData?.products && Array.isArray(responseData.products)) {
        return responseData.products.map(formatProductData);
      }
      return [];
    } catch (e) {
      console.error("Error parsing product data:", e);
      return [];
    }
  };

  /**
   * Processes product search results for card display (capped at maxProductsToDisplay)
   * @param {Object} toolUseResponse - The response from the tool
   * @returns {Array} Processed product data
   */
  const processProductSearchResult = (toolUseResponse) => {
    try {
      console.log("Processing product search result");
      const products = formatAllProductsFromResult(toolUseResponse)
        .slice(0, AppConfig.tools.maxProductsToDisplay);
      console.log(`Found ${products.length} products to display`);
      return products;
    } catch (error) {
      console.error("Error processing product search results:", error);
      return [];
    }
  };

  /**
   * Formats a money object ({ amount, currency }) into a deterministic
   * display string. Amounts are minor currency units (e.g. 248300 = 2483.00 UAH).
   * @param {{amount: number|string, currency: string}} money
   * @returns {string|null}
   */
  const formatMoney = (money) => {
    if (!money || !money.currency) return null;
    const amount = Number(money.amount);
    if (!Number.isFinite(amount)) return null;
    return `${(amount / 100).toFixed(2)} ${money.currency}`;
  };

  /**
   * Formats a product data object
   * @param {Object} product - Raw product data
   * @returns {Object} Formatted product data
   */
  const formatProductData = (product) => {
    const min = product.price_range?.min ?? product.variants?.[0]?.price;
    const max = product.price_range?.max;

    const minStr = formatMoney(min);
    let price = minStr || 'Ціна не вказана';
    if (minStr && max) {
      const maxStr = formatMoney(max);
      if (maxStr && maxStr !== minStr) {
        price = `від ${minStr}`;
      }
    }

    return {
      id: product.id || product.product_id || `product-${Math.random().toString(36).substring(7)}`,
      title: product.title || 'Product',
      price,
      image_url: product.media?.[0]?.url || '',
      description: (typeof product.description === 'string'
        ? product.description
        : product.description?.html) || '',
      url: product.url || '',
      variant_id: product.variants?.[0]?.id || null
    };
  };

  // Must stay byte-identical to the label referenced in
  // app/prompts/standard-assistant.txt response_rules.
  const PRICE_SUMMARY_LABEL = 'ФОРМАТОВАНІ ЦІНИ';

  /**
   * Builds an extra tool_result content block containing correctly-converted,
   * pre-formatted prices for every product in a search_catalog response.
   * Appended (not replacing) the raw tool content, so Claude is steered to
   * copy prices from here verbatim instead of computing them from raw JSON.
   * @param {Array} originalContent - toolUseResponse.content (raw MCP content blocks)
   * @param {Array} allFormattedProducts - full (unsliced) formatted product list
   * @returns {Array} content array to store in conversation history
   */
  const appendPriceSummaryBlock = (originalContent, allFormattedProducts) => {
    if (!allFormattedProducts.length) return originalContent;

    const lines = allFormattedProducts.map(
      (p) => `- ${p.title}: ${p.price} (id: ${p.id})`
    );

    const summaryText =
      `${PRICE_SUMMARY_LABEL} (авторитетне джерело цін для цієї відповіді):\n${lines.join('\n')}`;

    return [
      ...(Array.isArray(originalContent) ? originalContent : []),
      { type: 'text', text: summaryText }
    ];
  };

  /**
   * Adds a tool result to the conversation history
   * @param {Array} conversationHistory - The conversation history
   * @param {string} toolUseId - The ID of the tool use request
   * @param {string} content - The content of the tool result
   * @param {string} conversationId - The conversation ID
   */
  const addToolResultToHistory = async (conversationHistory, toolUseId, content, conversationId) => {
    const toolResultMessage = {
      role: 'user',
      content: [{
        type: "tool_result",
        tool_use_id: toolUseId,
        content: content
      }]
    };

    // Add to in-memory history
    conversationHistory.push(toolResultMessage);

    // Save to database with special format to indicate tool result
    if (conversationId) {
      try {
        await saveMessage(conversationId, 'user', JSON.stringify(toolResultMessage.content));
      } catch (error) {
        console.error('Error saving tool result to database:', error);
      }
    }
  };

  return {
    handleToolError,
    handleToolSuccess,
    processProductSearchResult,
    addToolResultToHistory
  };
}

export default {
  createToolService
};
