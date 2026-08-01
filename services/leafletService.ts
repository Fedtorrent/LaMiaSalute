import { Browser } from '@capacitor/browser';

/**
 * Servizio per la gestione dei bugiardini digitali.
 * Permette di cercare e visualizzare i foglietti illustrativi ufficiali.
 */
export const LeafletService = {
  /**
   * Genera un URL di ricerca per il farmaco specificato.
   * Utilizza operatori di ricerca per limitare i risultati a siti autorevoli.
   */
  getSearchUrl: (medName: string): string => {
    // Pulisce il nome da eventuali dosaggi o caratteri speciali per la ricerca
    const cleanName = medName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    const query = `${cleanName} foglietto illustrativo site:agenziafarmaco.gov.it OR site:torrinomedica.it OR site:fogliettoillustrativo.net`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  },

  /**
   * Apre il bugiardino in un browser in-app o nel browser di sistema.
   * @param url L'URL da aprire. Se non fornito, viene generato uno di ricerca basato sul nome.
   * @param medName Nome del farmaco (usato se url non è presente).
   */
  openLeaflet: async (url?: string, medName?: string): Promise<string | undefined> => {
    let targetUrl = url;

    if (!targetUrl && medName) {
      targetUrl = LeafletService.getSearchUrl(medName);
    }

    if (targetUrl) {
      try {
        await Browser.open({ url: targetUrl, toolbarColor: '#0057FF' });
        return targetUrl;
      } catch (error) {
        console.error("Errore nell'apertura del browser:", error);
        // Fallback: prova ad aprire tramite window.open se su web
        window.open(targetUrl, '_blank');
        return targetUrl;
      }
    }
    return undefined;
  }
};
