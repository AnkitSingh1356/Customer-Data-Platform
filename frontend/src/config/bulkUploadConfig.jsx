export const BULK_UPLOAD_CONFIG = {
  customers: {
    key: "customers",

    title: "Bulk Upload Customers",

    subtitle:
      "Upload customer records using a CSV file.",

    uploadEndpoint: "/api/customers/bulk-upload",

    templateEndpoint: "/api/customers/template",

    acceptedFileTypes: ".csv",

    duplicateKey: "email",

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
