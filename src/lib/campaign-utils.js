export const parseCampaignName = (name) => {
  if (!name) return { name: '-', network: 'Unknown', offer: 'Unknown', adAccount: 'Unknown', mediaBuyer: 'Unknown' };

  // Normalize the name by trimming whitespace
  const normalizedName = name.trim();

  // Complete list of networks
  const knownNetworks = [
    'ACA', 'Banner', 'Banner Edge', 'Clickbank', 'Comments', 'Cost Guide', 'Digistore', 'IDSG',
    'Lead Economy', 'Leadnomics', 'Maxweb', 'Monarch', 'Pointer', 'Pure Ads',
    'Smart Financial', 'Suited', 'TLG', 'Transparent Ads', 'Wisdom'
  ];
  
  // Complete list of offers
  const knownOffers = [
    'ACA', 'Auto', 'Bathroom', 'Comments', 'Debt', 'EasySolar', 'EDU',
    'Health', 'InsureMyCar', 'Mini Mobile', 'Mitolyn', 'Roofing', 'Solar', 
    'VSL', 'WifiProfits', 'Your Health Pro Finder', 'YHPF'
  ];
  
  // Complete list of ad accounts
  const knownAdAccounts = [
    'Adrianna 01', 'Adrianna 02', 'Adrianna 03',
    'Carol 01', 'Carol 02',
    'Caros 04', 'Caros 05',
    'CC 1', 'CC 2', 'CC 3', 'CC 4', 'CC 5', 'CC 6', 'CC 7', 'CC 8',
    'Comments',
    'DQ Rev',
    'DS 844',
    'Frederick 01', 'Frederick 02', 'Frederick 03',
    'Jack 01',
    'Jenna 02',
    'John 02', 'John 03', 'John 05',
    'Josceel 02', 'Josceel 03', 'Josceel 05',
    'Kiley 02',
    'No Tick 02',
    'Nuham 01', 'Nuham 02', 'Nuham 03', 'Nuham 04',
    'Oliver 01', 'Oliver 02', 'Oliver 03',
    'Personal Ad Acc',
    'Phoenix 01', 'Phoenix 02', 'Phoenix 06',
    'Sophia 01', 'Sophia 02',
    'Taboola',
    'Thomas 01', 'Thomas 02', 'Thomas 03', 'Thomas 04', 'Thomas 05'
  ];
  
  // Complete list of media buyers
  const knownMediaBuyers = [
    'Aakash', 'Asheesh', 'Bikki', 'Daniel', 'Edwin', 'Emil', 'Gagan',
    'Isha', 'Ishaan', 'Mike', 'Mike C', 'Nick N', 'Pavan', 'Zel'
  ];

  // Split by " - " or " | " to extract components
  const parts = normalizedName.split(/ - | \| /).map(part => part.trim());
  
  // Default values
  let network = 'Unknown';
  let offer = 'Unknown';
  let adAccount = 'Unknown';
  let mediaBuyer = 'Unknown';
  
  // Special case handling for specific campaign patterns
  
  // 1. Handle Banner and Banner Edge early - normalize both to "Banner"
  if (normalizedName.toLowerCase().includes('banner edge') || 
      parts.some(part => part.toLowerCase().includes('banner edge'))) {
    network = 'Banner';
  } else if (normalizedName.toLowerCase().includes('banner') || 
             parts.some(part => part.toLowerCase().trim() === 'banner')) {
    network = 'Banner';
  }
  
  // 2. Handle "Snap Degree EDU - Transparent Ads - Thomas 5 Mike"
  if (normalizedName.includes('Snap Degree EDU') && normalizedName.includes('Transparent Ads')) {
    network = 'Transparent Ads';
    offer = 'EDU';
    adAccount = 'Thomas 05';
    mediaBuyer = 'Mike';
    return { name: normalizedName, network, offer, adAccount, mediaBuyer };
  }
  
  // 3. Handle all "Aggro ACA" campaigns - they're all Mike's campaigns with ACA offer on Suited network
  if (normalizedName.startsWith('Aggro ACA')) {
    network = 'Suited';
    offer = 'ACA';
    mediaBuyer = 'Mike';
    return { name: normalizedName, network, offer, adAccount, mediaBuyer };
  }
  
  // 4. Handle "Wisdom - InsureMyCar - Adrianna 03 - DL - Mike"
  if (normalizedName.includes('Wisdom') && normalizedName.includes('InsureMyCar') && normalizedName.includes('Adrianna 03')) {
    network = 'Wisdom';
    offer = 'InsureMyCar';
    adAccount = 'Adrianna 03';
    mediaBuyer = 'Mike';
    return { name: normalizedName, network, offer, adAccount, mediaBuyer };
  }
  
  // First pass: Try to identify network and media buyer (only if not already set by special cases)
  if (network === 'Unknown') {
    parts.forEach(part => {
      const trimmedPart = part.trim();
      
      // Check for network (exact match first, then partial)
      const matchingNetwork = knownNetworks.find(n => {
        const normalizedNetwork = n.toLowerCase();
        const normalizedPart = trimmedPart.toLowerCase();
        
        // Handle Banner/Banner Edge specifically
        if ((normalizedNetwork === 'banner' || normalizedNetwork === 'banner edge') && 
            (normalizedPart === 'banner' || normalizedPart === 'banner edge' || 
             normalizedPart.includes('banner'))) {
          return true;
        }
        
        // Handle Leadnomics/Leadnomic specifically
        if ((normalizedNetwork === 'leadnomics' || normalizedNetwork === 'leadnomic') && 
            (normalizedPart === 'leadnomics' || normalizedPart === 'leadnomic' || 
             normalizedPart.includes('leadnom'))) {
          return true;
        }
        
        // Standard matching
        return trimmedPart === n || trimmedPart.includes(n) || n.includes(trimmedPart);
      });
      
      if (matchingNetwork) {
        // Normalize Banner Edge to Banner
        network = matchingNetwork === 'Banner Edge' ? 'Banner' : matchingNetwork;
      }
    });
  }
  
  parts.forEach(part => {
    // Check for media buyer (exact match first, then partial)
    const matchingMediaBuyer = knownMediaBuyers.find(m => 
      part === m || part.includes(m) || m.includes(part)
    );
    if (matchingMediaBuyer) {
      mediaBuyer = matchingMediaBuyer;
    }
  });
  
  // Second pass: Try to identify offer and ad account
  parts.forEach(part => {
    // Skip if this part is already identified as network or media buyer
    if (part === network || part === mediaBuyer) return;
    
    // Check for offer (exact match first, then partial)
    const matchingOffer = knownOffers.find(o => 
      part === o || part.includes(o) || o.includes(part)
    );
    if (matchingOffer) {
      offer = matchingOffer;
    }
    
    // Check for ad account (exact match first, then partial)
    const matchingAdAccount = knownAdAccounts.find(a => 
      part === a || part.includes(a) || a.includes(part)
    );
    if (matchingAdAccount) {
      adAccount = matchingAdAccount;
    }
  });
  
  // Fix for "Thomas 5" -> "Thomas 05"
  if (adAccount.includes('Thomas 5') && !adAccount.includes('Thomas 05')) {
    adAccount = 'Thomas 05';
  }
  
  // Special case: Handle Suited Health YHPF
  if (normalizedName.includes('Suited Health YHPF')) {
    network = 'Suited';
    offer = 'Your Health Pro Finder';
  }
  
  // Special case: Fix stuck ad account and media buyer (like "Josceel 03- Ishaan")
  parts.forEach(part => {
    // Check for patterns like "Josceel 03- Ishaan"
    for (const accName of knownAdAccounts) {
      for (const buyerName of knownMediaBuyers) {
        if (part.includes(accName) && part.includes(buyerName)) {
          // Extract both ad account and media buyer from the combined part
          const adAccountIndex = part.indexOf(accName);
          const mediaBuyerIndex = part.indexOf(buyerName);
          
          if (adAccountIndex !== -1 && mediaBuyerIndex !== -1) {
            adAccount = accName;
            mediaBuyer = buyerName;
          }
        }
      }
    }
  });
  
  // Special case: Handle AdsPower2831 CC accounts
  if (adAccount.includes('AdsPower2831')) {
    const ccMatch = adAccount.match(/CC[ -]?(\d+)/);
    if (ccMatch) {
      adAccount = `CC ${ccMatch[1]}`;
    }
  }
  
  // Special case: Handle "DQ Rev" for debt offers
  if (offer === 'Debt' && adAccount === 'Unknown') {
    adAccount = 'DQ Rev';
  }
  
  // Special case: Handle "Comments" as both offer and ad account
  if (network === 'Comments') {
    offer = 'Comments';
    adAccount = 'Comments';
  }
  
  // If we couldn't identify components, use the parts in order
  if (network === 'Unknown' && parts.length >= 1) {
    network = parts[0];
  }
  if (offer === 'Unknown' && parts.length >= 2) {
    offer = parts[1];
  }
  if (adAccount === 'Unknown' && parts.length >= 3) {
    adAccount = parts[2];
  }
  if (mediaBuyer === 'Unknown' && parts.length >= 4) {
    mediaBuyer = parts[3];
  }
  
  return {
    name: normalizedName,
    network,
    offer,
    adAccount,
    mediaBuyer
  };
}; 