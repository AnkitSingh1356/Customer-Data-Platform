// Displays a full KPI breakdown for a selected campaign.
// Monetary fields (budget, spent) are formatted with toLocaleString.
// Date fields fall back to "—" when absent to avoid rendering "Invalid Date".
const CampaignDetailsModal = ({
    campaign,
    onClose,
  }) => {
    if (!campaign) return null;

    return (
      <div className="modal-backdrop">
        <div className="promo-modal">
          <div className="promo-modal-header">
            <h2>
              {campaign.campaign_name}
            </h2>
            <button
              className="promo-close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="promo-modal-grid">
            <div>
              <span>Type</span>
  
              <strong>
                {campaign.campaign_type}
              </strong>
            </div>
  
            <div>
              <span>Status</span>
  
              <strong>
                {campaign.status}
              </strong>
            </div>
  
            <div>
              <span>Budget</span>
  
              <strong>
                $
                {Number(
                  campaign.total_budget,
                ).toLocaleString()}
              </strong>
            </div>
  
            <div>
              <span>Spent</span>
  
              <strong>
                $
                {Number(
                  campaign.spent_amount,
                ).toLocaleString()}
              </strong>
            </div>
  
            <div>
              <span>Audience</span>
  
              <strong>
                {Number(
                  campaign.audience_size,
                ).toLocaleString()}
              </strong>
            </div>
  
            <div>
              <span>Conversion</span>
  
              <strong>
                {
                  campaign.conversion_rate
                }
                %
              </strong>
            </div>
  
            <div>
              <span>Start</span>
  
              <strong>
                {campaign.start_date
                  ? new Date(
                      campaign.start_date,
                    ).toLocaleDateString()
                  : "—"}
              </strong>
            </div>
  
            <div>
              <span>End</span>
  
              <strong>
                {campaign.end_date
                  ? new Date(
                      campaign.end_date,
                    ).toLocaleDateString()
                  : "—"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default CampaignDetailsModal;
