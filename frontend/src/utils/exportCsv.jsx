export function exportCsvFile({
    data = [],
    filename = "export.csv",
  }) {
    if (!data.length) {
      alert("No data available to export");
  
      return;
    }
  
    const headers = Object.keys(data[0]);
  
    const csvRows = [
      headers.join(","),
  
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
  
    const url =
      window.URL.createObjectURL(blob);
  
    const a =
      document.createElement("a");
  
    a.href = url;
  
    a.download = filename;

    document.body.appendChild(a);
  
    a.click();

    document.body.removeChild(a);
  
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
  }
