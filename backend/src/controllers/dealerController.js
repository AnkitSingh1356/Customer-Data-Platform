//cdp-backend\src\controllers\dealerController.js
const svc = require("../services/dealerService");
const fs = require("fs");
const err = (res, e, msg = "Server error", context = "") => {
  console.error("[DealerController]", context, e);
  return res.status(e?.status || 500).json({ error: e?.message || msg });
};

async function stats(req, res) {
  try {
    return res.json(await svc.getStats());
  } catch (e) {
    return err(res, e);
  }
}

async function hierarchy(req, res) {
  try {
    return res.json(await svc.getHierarchy(req.query.search || ""));
  } catch (e) {
    return err(res, e);
  }
}

async function detail(req, res) {
  try {
    const d = await svc.getDealerDetail(req.params.code);
    if (!d) return res.status(404).json({ error: "Dealer not found." });
    return res.json(d);
  } catch (e) {
    return err(res, e);
  }
}

async function requestAccess(req, res) {
  try {
    const r = await svc.createAccessRequest(
      req.params.code,
      req.body.target_uuid,
    );
    return res.status(201).json(r);
  } catch (e) {
    return err(res, e);
  }
}
async function template(req, res) {
  try {
    const csv =
`name,code,parent_code,type,tier,region,city,country,email,phone,status
Dealer HQ,DLR-HQ-1,,HQ,gold,APAC,Tokyo,JP,test@test.com,9999999999,Active`;

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dealer_template.csv"
    );

    res.setHeader("Content-Type", "text/csv");

    return res.send(csv);

  } catch (e) {
    return err(res, e);
  }
}
async function bulkUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "CSV file required.",
      });
    }

    const result = await svc.bulkUpload(req.file.path);

    fs.unlink(req.file.path, () => {});

    return res.json(result);

  } catch (e) {
    return err(res, e);
  }
}
module.exports = {
  stats,
  hierarchy,
  detail,
  requestAccess,
  template,
  bulkUpload,
};
