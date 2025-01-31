// date.js
// Used to fix dates from across different platforms

// Cleans the date and passes it to the date formater
export function cleanDate(dateStr) {
    dateStr = dateStr.trim();
    let dateObj = null;
    let match;

    // Format 1: "1/23/2025, 11:59:59 PM"
    const regex1 = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i;
    match = dateStr.match(regex1);
    if (match) {
        let month   = parseInt(match[1], 10);
        let day     = parseInt(match[2], 10);
        let year    = parseInt(match[3], 10);
        let hour    = parseInt(match[4], 10);
        let minute  = parseInt(match[5], 10);
        let second  = parseInt(match[6], 10);
        let ampm    = match[7].toUpperCase();
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        dateObj = new Date(year, month - 1, day, hour, minute, second);
    } else {
        // Format 2: "02/05/2025 at 11:59pm"
        const regex2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
        match = dateStr.match(regex2);
        if (match) {
            let month   = parseInt(match[1], 10);
            let day     = parseInt(match[2], 10);
            let year    = parseInt(match[3], 10);
            let hour    = parseInt(match[4], 10);
            let minute  = parseInt(match[5], 10);
            let second  = 0;
            let ampm    = match[6].toUpperCase();
            if (ampm === "PM" && hour !== 12) hour += 12;
            if (ampm === "AM" && hour === 12) hour = 0;
            dateObj = new Date(year, month - 1, day, hour, minute, second);
        } else {
            // Format 3 & 4: "Jan 19 at 11:59PM" or "Feb 02 at 11:59PM"
            const regex3 = /^([A-Za-z]{3})\s+(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
            match = dateStr.match(regex3);
            if (match) {
                let monthStr = match[1];
                let day      = parseInt(match[2], 10);
                let year     = new Date().getFullYear(); // Default to current year
                let hour     = parseInt(match[3], 10);
                let minute   = parseInt(match[4], 10);
                let second   = 0;
                let ampm     = match[5].toUpperCase();
                // Map three-letter month to its numeric value.
                const months = {
                    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
                };
                let normalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
                let month = months[normalizedMonth] || 1;
                if (ampm === "PM" && hour !== 12) hour += 12;
                if (ampm === "AM" && hour === 12) hour = 0;
                dateObj = new Date(year, month - 1, day, hour, minute, second);
            } else {
                // Fallback: try the built-in Date parser.
                dateObj = new Date(dateStr);
            }
        }
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
        return "Invalid Date";
    }

	// Format the date correctly
    let month  = dateObj.getMonth() + 1;
    let day    = dateObj.getDate();
    let year   = dateObj.getFullYear();
    let hour   = dateObj.getHours();
    let minute = dateObj.getMinutes();
    let second = dateObj.getSeconds();
    let ampm   = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) { hour = 12; }
    minute = minute < 10 ? "0" + minute : minute;
    second = second < 10 ? "0" + second : second;

    return `${month}/${day}/${year}, ${hour}:${minute}:${second} ${ampm}`;
}
