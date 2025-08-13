import * as CryptoJS from 'crypto-js';

const _hashKey: string = (import.meta as any).env.VITE_ALGORITHM_AES_WEB

export function EncryptAES(data: any): string {
    const keyForCryptoJS = CryptoJS.enc.Base64.parse(_hashKey);
    const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        keyForCryptoJS,
        {
            mode: CryptoJS.mode.ECB
        },
    ).toString();
    return encodeURIComponent(encryptedData);
}
