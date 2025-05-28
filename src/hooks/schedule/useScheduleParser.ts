
import { parseServerResponseSimple } from './useServerResponseHandler';

// This file acts as a shim to provide `parseServerResponseSimple`
// for read-only files that still import from `useScheduleParser`.
// The actual implementation is in `useServerResponseHandler`.
export { parseServerResponseSimple as parseServerResponse };
