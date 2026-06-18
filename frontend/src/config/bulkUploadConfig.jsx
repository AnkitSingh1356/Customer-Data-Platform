// Configuration objects consumed by BulkUploadModal to drive upload behaviour
// per entity type. Each entry must provide upload/template endpoints, the field
// used for deduplication, and the minimum required CSV columns.
export const BULK_UPLOAD_CONFIG = {
  customers: {
    key: "customers",

    title: "Bulk Upload Customers",

    subtitle:
      "Upload customer records using a CSV file.",

    uploadEndpoint: "/api/customers/bulk-upload",

    // Used to download a pre-formatted CSV header template for users
    templateEndpoint: "/api/customers/template",

    acceptedFileTypes: ".csv",

    // Server uses this field to detect and skip duplicate records
    duplicateKey: "email",

    // BulkUploadModal rejects files missing any of these column headers
    requiredFields: [
      "first_name",
      "email",
    ],

    sampleFileName: "customer_template.csv",
  },

  dealers: {
    key: "dealers",

    title: "Bulk Upload Dealers",

    subtitle:
      "Upload dealer hierarchy records using a CSV file.",

    uploadEndpoint: "/api/dealers/bulk-upload",

    templateEndpoint: "/api/dealers/template",

    acceptedFileTypes: ".csv",

    // Dealer code is the unique business key used for deduplication
    duplicateKey: "code",

    requiredFields: [
      "name",
      "code",
      "region",
    ],

    sampleFileName: "dealer_template.csv",
  },
};

export default BULK_UPLOAD_CONFIG;
