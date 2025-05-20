import { Injectable } from '@angular/core';
import { Contact } from './app.component';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  constructor() {}

  // Genera URL para WhatsApp
  generateWhatsAppUrl(contact: Contact, messageTemplate: string): string {
    const phoneClean = contact.phone.replace(/\D/g, '');

    // Personalizar el mensaje con el nombre del contacto
    const personalizedMessage = messageTemplate.replace(/{nombre}/g, contact.name);

    // Codificar el mensaje para que sea válido en una URL
    const encodedMessage = encodeURIComponent(personalizedMessage);

    // Usar wa.me para mayor compatibilidad
    return `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodedMessage}`;
  }

  // Abre WhatsApp Web con el mensaje
  openWhatsApp(contact: Contact, messageTemplate: string): void {
    const url = this.generateWhatsAppUrl(contact, messageTemplate);
    window.open(url, '_blank');
  }
}
