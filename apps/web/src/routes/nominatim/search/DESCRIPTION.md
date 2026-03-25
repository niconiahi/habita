# Location search

This is a behind-the-scenes endpoint that powers the location/address search throughout the platform. When a user types an address in the property creation or editing form, this endpoint searches for matching locations and returns the results.

It connects to Nominatim (a geographic search service) to find addresses, with built-in protections against slow responses and oversized results.
