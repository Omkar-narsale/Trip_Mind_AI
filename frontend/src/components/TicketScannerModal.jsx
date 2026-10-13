import React, { useState, useRef } from 'react';
import { 
  Scan, Upload, Sparkles, CheckCircle2, AlertCircle, Plane, Building2, 
  Calendar, Users, FileText, ArrowRight, X, Image as ImageIcon, RefreshCw 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function TicketScannerModal({ isOpen, onClose, onApplyExtractedTrip }) {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [scanError, setScanError] = useState(null);

  if (!isOpen) return null;

  // Handle local image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setScanError(null);
    setExtractedData(null);
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Run Vision AI Scanning
  const handleScanImage = async (overrideBase64 = null) => {
    const base64Data = overrideBase64 || imagePreview;
    if (!base64Data) {
      setScanError('Please upload an image or select a demo ticket first.');
      return;
    }

    setScanning(true);
    setScanError(null);

    try {
      const res = await fetch(`${API_BASE}/api/vision/scan-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64Data,
          mime_type: 'image/jpeg'
        })
      });

      if (!res.ok) {
        throw new Error(`Vision scanner failed with status ${res.status}`);
      }

      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        setExtractedData(responseData.data);
      } else {
        throw new Error(responseData.message || 'Could not parse ticket');
      }
    } catch (err) {
      console.error('Vision scan error:', err);
      setScanError('Vision scan failed. Please verify Groq API connection or try another image.');
    } finally {
      setScanning(false);
    }
  };

  // One-click demo triggers for testing & viva presentation
  const handleLoadDemo = (type) => {
    setExtractedData(null);
    setScanError(null);
    if (type === 'jaipur_flight') {
      setImagePreview('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80');
      handleScanImage('DEMO_JAIPUR_TICKET_PAYLOAD');
    } else if (type === 'goa_resort') {
      setImagePreview('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80');
      handleScanImage('DEMO_GOA_VOUCHER_PAYLOAD');
    }
  };

  // Auto-fill into main Trip Planner form
  const handleApplyToPlanner = () => {
    if (!extractedData) return;
    if (onApplyExtractedTrip) {
      onApplyExtractedTrip({
        origin: extractedData.origin || 'Mumbai',
        destination: extractedData.destination || 'Jaipur',
        departure_date: extractedData.departure_date || '',
        return_date: extractedData.return_date || '',
        travelers: extractedData.travelers_count || 1,
        budget: extractedData.budget_estimate || 25000,
        carrier_or_hotel: extractedData.carrier_or_hotel,
        pnr: extractedData.booking_reference_pnr
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-cream-300 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-cream-100 border-b border-cream-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-travel-dark">Multimodal AI Ticket Scanner</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-forest-200 text-forest-800">
                  CO5 Vision Model
                </span>
              </div>
              <p className="text-xs text-travel-muted">
                Extract destination, dates, and passengers directly from your travel ticket or voucher.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-200 hover:bg-cream-300 text-travel-dark flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* Quick Demo Buttons for Instant Testing */}
          <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-travel-dark flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>One-Click Demos:</span>
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleLoadDemo('jaipur_flight')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-forest-50 text-forest-800 border border-cream-300 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plane className="w-3 h-3 text-forest-700" />
                <span>IndiGo Flight (Jaipur)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadDemo('goa_resort')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-forest-50 text-forest-800 border border-cream-300 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3 h-3 text-purple-700" />
                <span>Taj Resort Voucher (Goa)</span>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cream-300 hover:border-forest-600 rounded-3xl p-8 text-center bg-cream-50/50 hover:bg-cream-50 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-travel-dark mb-1">
                Click to upload your ticket or booking voucher
              </h4>
              <p className="text-xs text-travel-muted">
                Supports PNG, JPG, or JPEG boarding passes, train tickets, and hotel PDFs
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-cream-300 bg-black/5 max-h-56 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Uploaded Ticket Preview"
                className="w-full h-48 object-cover rounded-xl"
              />
              
              {/* Laser Scanning Animation */}
              {scanning && (
                <div className="absolute inset-0 bg-forest-900/30 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                  <div className="w-full h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce mb-2" />
                  <span className="text-xs font-extrabold uppercase tracking-widest bg-dark-900/80 px-3 py-1 rounded-full border border-white/20">
                    Vision Model Scanning (qwen/qwen3.8-27b)...
                  </span>
                </div>
              )}

              {!scanning && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-travel-dark shadow-md backdrop-blur-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Image</span>
                </button>
              )}
            </div>
          )}

          {scanError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Action to scan if an image was manually selected */}
          {imagePreview && !extractedData && !scanning && (
            <button
              type="button"
              onClick={() => handleScanImage()}
              className="w-full py-3 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-subtle transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Ticket with Vision AI</span>
            </button>
          )}

          {/* Extracted Results Card */}
          {extractedData && (
            <div className="rounded-2xl border border-cream-300 bg-cream-50 p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-travel-dark uppercase tracking-wider">
                    {extractedData.document_type}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-forest-800 bg-forest-100 px-2.5 py-0.5 rounded-full">
                  Confidence: {(extractedData.confidence_score * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-cream-200">
                  <span className="text-travel-muted block text-[10px] font-bold uppercase">Origin → Destination</span>
                  <p className="font-extrabold text-travel-dark text-sm mt-0.5">
                    {extractedData.origin || 'Mumbai'} → {extractedData.destination || 'Jaipur'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-cream-200">
                  <span className="text-travel-muted block text-[10px] font-bold uppercase">Travel Dates</span>
                  <p className="font-bold text-travel-dark mt-0.5">
                    {extractedData.departure_date || 'Flexible'} {extractedData.return_date ? `to ${extractedData.return_date}` : ''}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-cream-200">
                  <span className="text-travel-muted block text-[10px] font-bold uppercase">Carrier / Property</span>
                  <p className="font-bold text-travel-dark mt-0.5">
                    {extractedData.carrier_or_hotel || 'Verified Booking'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-cream-200">
                  <span className="text-travel-muted block text-[10px] font-bold uppercase">Booking Ref / PNR</span>
                  <p className="font-mono font-extrabold text-forest-800 mt-0.5">
                    {extractedData.booking_reference_pnr || 'CONFIRMED'}
                  </p>
                </div>
              </div>

              {extractedData.notes && extractedData.notes.length > 0 && (
                <div className="p-3 rounded-xl bg-white/70 border border-cream-200 text-xs">
                  <span className="text-travel-muted block text-[10px] font-bold uppercase mb-1">Detected Amenities & Notes:</span>
                  <ul className="list-disc list-inside text-travel-body space-y-0.5 text-[11px]">
                    {extractedData.notes.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-cream-100 border-t border-cream-300 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-travel-muted hover:text-travel-dark transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {extractedData && (
            <button
              type="button"
              onClick={handleApplyToPlanner}
              className="px-6 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs flex items-center gap-2 shadow-subtle transition-all cursor-pointer"
            >
              <span>Auto-Fill into Trip Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
