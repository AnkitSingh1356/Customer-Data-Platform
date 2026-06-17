// Generates a CSV from an array of plain objects and triggers a browser
// download. Column order matches the key order of the first row.
// `data` — array of flat objects; `filename` — suggested download name.
export function exportCsvFile({
    data = [],
    filename = "export.csv",
  }) {
    if (!data.length) {
      alert("No data available to export");

      return;
    }

    // Derive column headers from the first row's keys
    const headers = Object.keys(data[0]);

    const csvRows = [
      headers.join(","),

      // JSON.stringify each field to safely escape commas and quotes in values
      ...data.map((row) =>
        headers
          .map((field) =>
            JSON.stringify(row[field] ?? "")
          )
          .join(",")
      ),
    ];

    const blob = new Blob(
      [csvRows.join("\n")],
      {
        type: "text/csv",
      }
    );

    // Create a temporary object URL so the browser treats it as a file download
    const url =
      window.URL.createObjectURL(blob);

    // Programmatically click a hidden anchor to trigger the download dialog
    const a =
      document.createElement("a");

    a.href = url;

    a.download = filename;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    // Delay revocation slightly to ensure the browser has started the download
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
  }
