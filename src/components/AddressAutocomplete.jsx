import React, { useEffect, useRef, useState } from 'react';

/**
 * Simple wrapper around Google Places Autocomplete to provide address
 * suggestions while the user types. It loads the Google Maps script on
 * demand and exposes selected place details via the `onSelect` callback.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const AddressAutocomplete = ({ value, onChange, onSelect, placeholder }) => {
  const [predictions, setPredictions] = useState([]);
  const serviceRef = useRef(null);
  const detailsServiceRef = useRef(null);

  useEffect(() => {
    const initServices = () => {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      detailsServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
    };

    if (!window.google || !window.google.maps) {
      const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!key) return; // cannot initialise without API key
      loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`).then(initServices);
    } else {
      initServices();
    }
  }, []);

  const handleChange = e => {
    const val = e.target.value;
    onChange(val);
    if (serviceRef.current && val) {
      serviceRef.current.getPlacePredictions(
        { input: val, componentRestrictions: { country: 'es' } },
        preds => setPredictions(preds || [])
      );
    } else {
      setPredictions([]);
    }
  };

  const handleSelect = prediction => {
    if (!detailsServiceRef.current) return;
    detailsServiceRef.current.getDetails({ placeId: prediction.place_id }, details => {
      if (details) {
        onChange(details.formatted_address);
        onSelect && onSelect(details);
      }
    });
    setPredictions([]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-control fl-input"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || ' '}
      />
      {predictions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            background: '#fff',
            border: '1px solid #ccc',
            width: '100%',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {predictions.map(p => (
            <li
              key={p.place_id}
              onClick={() => handleSelect(p)}
              style={{ padding: '0.5rem', cursor: 'pointer' }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;

