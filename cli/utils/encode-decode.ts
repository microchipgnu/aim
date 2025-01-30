/**
 * Converts a Unicode string to base64 encoding
 * @example
 * // returns "SGVsbG8gd29ybGQh"
 * unicodeToBase64("Hello world!")
 * 
 * // returns "8J+RjPCfj70="
 * unicodeToBase64("👌😽")
 */
export function unicodeToBase64(str: string) {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(str);
    let binary = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return encodeURIComponent(btoa(binary));
  }
  
  /**
   * Converts a base64 string back to Unicode
   * @example
   * // returns "Hello world!"
   * base64ToUnicode("SGVsbG8gd29ybGQh")
   * 
   * // returns "👌😽" 
   * base64ToUnicode("8J+RjPCfj70=")
   */
  export function base64ToUnicode(base64: string) {
    const decoded = decodeURIComponent(base64);
    const binary = atob(decoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }