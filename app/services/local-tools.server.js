/**
 * Local Tools Service
 * Defines and executes tools that run locally without MCP
 */

/**
 * Available local tools with their schemas
 */
export const localTools = [
  {
    name: "get_store_info",
    description: "Get basic store information including hours, contact details, and policies. Use this when customers ask about store hours, contact information, or general store details.",
    input_schema: {
      type: "object",
      properties: {
        info_type: {
          type: "string",
          enum: ["hours", "contact", "shipping", "all"],
          description: "Type of store information to retrieve"
        }
      },
      required: ["info_type"]
    }
  }
];

/**
 * Execute a local tool
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} toolArgs - Arguments for the tool
 * @returns {Promise<Object>} Tool execution result
 */
export async function executeLocalTool(toolName, toolArgs) {
  console.log(`Executing local tool: ${toolName}`, toolArgs);

  switch (toolName) {
    case "get_store_info":
      return getStoreInfo(toolArgs);

    default:
      throw new Error(`Unknown local tool: ${toolName}`);
  }
}

/**
 * Get store information
 * @param {Object} args - Tool arguments
 * @returns {Object} Store information
 */
function getStoreInfo(args) {
  const storeData = {
    hours: {
      weekdays: "10:00 AM - 6:00 PM",
      weekends: "10:00 AM - 4:00 PM",
      timezone: "EET"
    },
    contact: {
      email: "info@informatica.com.ua",
      phone: "+380(99) 381-5288",
      chat: "Available 24/7"
    },
    shipping: {
      domestic: "Delivery based on Nova Poshta pricing",
      processing_time: "1-2 business days"
    }
  };

  const { info_type } = args;

  if (info_type === "all") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(storeData, null, 2)
        }
      ]
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(storeData[info_type] || {}, null, 2)
      }
    ]
  };
}

export default {
  localTools,
  executeLocalTool
};
