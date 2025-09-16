"use client";

import { useEffect } from "react";

/**
 * Component to handle hydration mismatches caused by browser extensions
 * This suppresses hydration warnings for known browser extension attributes
 */
export default function HydrationFix() {
  useEffect(() => {
    // Remove browser extension attributes that cause hydration mismatches
    const removeExtensionAttributes = () => {
      const body = document.body;
      if (body) {
        // Remove Grammarly extension attributes
        body.removeAttribute('data-new-gr-c-s-check-loaded');
        body.removeAttribute('data-gr-ext-installed');
        
        // Remove other common extension attributes
        body.removeAttribute('data-gramm');
        body.removeAttribute('data-gramm_editor');
        body.removeAttribute('data-gramm-editor');
        
        // Remove any other attributes that might cause issues
        const attributesToRemove: string[] = [];
        for (let i = 0; i < body.attributes.length; i++) {
          const attr = body.attributes[i];
          if (attr.name.startsWith('data-gr-') || attr.name.startsWith('data-gramm')) {
            attributesToRemove.push(attr.name);
          }
        }
        
        attributesToRemove.forEach(attrName => {
          body.removeAttribute(attrName);
        });
      }
    };

    // Remove attributes immediately
    removeExtensionAttributes();

    // Set up a MutationObserver to remove attributes if they get added again
    const observer = new MutationObserver((mutations) => {
      let shouldRemove = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          const attributeName = mutation.attributeName;
          if (attributeName && (attributeName.includes('gr-') || attributeName.includes('gramm'))) {
            shouldRemove = true;
          }
        }
      });
      
      if (shouldRemove) {
        removeExtensionAttributes();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-gramm',
        'data-gramm_editor',
        'data-gramm-editor'
      ]
    });

    // Also observe for any new attributes added
    const generalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          const attributeName = mutation.attributeName;
          if (attributeName && (attributeName.includes('gr-') || attributeName.includes('gramm'))) {
            document.body.removeAttribute(attributeName);
          }
        }
      });
    });

    generalObserver.observe(document.body, {
      attributes: true
    });

    return () => {
      observer.disconnect();
      generalObserver.disconnect();
    };
  }, []);

  return null;
}