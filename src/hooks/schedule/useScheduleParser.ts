
import { parseServerResponse } from './useServerResponseHandler';

// This file acts as a shim to provide `parseServerResponse`
// for read-only files that still import from `useScheduleParser`.
// The actual implementation is in `useServerResponseHandler`.
export { parseServerResponse };
