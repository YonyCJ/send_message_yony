import {Component, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { WhatsappService } from './whatsapp.service';
import * as XLSX from 'xlsx';


export interface Contact {
  id?: number;
  name: string;
  phone: string;
  message?: string;
  sent?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'send_whatsapp';
  contacts: Contact[] = [];
  messageTemplate: string = 'Hola {nombre}, te escribo para...';
  showCopyNotification = false;
  highlightedRowId: number | null = null;
  selectedFileName: string = '';

  newContact: Contact = {
    name: '',
    phone: ''
  };

  fileContent: string = '';

  constructor(private whatsappService: WhatsappService) {}

  ngOnInit() {
    // Cargar plantilla guardada al iniciar el componente
    const savedTemplate = localStorage.getItem('messageTemplate');
    if (savedTemplate) {
      this.messageTemplate = savedTemplate;
    }
  }

  addContact(): void {
    if (this.newContact.name && this.newContact.phone) {
      const contact: Contact = {
        id: Date.now(),
        name: this.newContact.name,
        phone: this.newContact.phone,
        sent: false
      };

      this.contacts.push(contact);

      this.newContact = {
        name: '',
        phone: ''
      };
    }
  }

  removeContact(id: number): void {
    this.contacts = this.contacts.filter(contact => contact.id !== id);
  }

  sendMessage(contact: Contact): void {
    this.setHighlightedRow(contact.id as number);
    this.whatsappService.openWhatsApp(contact, this.messageTemplate);
    contact.sent = true;
  }

  sendToAll(): void {
    this.contacts.forEach((contact, index) => {
      setTimeout(() => {
        this.sendMessage(contact);
      }, index * 1000);
    });
  }

  importContacts(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const lines = content.split('\n');

        lines.forEach(line => {
          if (line.trim()) {
            const parts = line.split(',').map(item => item.trim());
            if (parts.length >= 2) {
              const [name, phone] = parts;
              if (name && phone) {
                this.contacts.push({
                  id: Date.now() + Math.random(),
                  name,
                  phone,
                  sent: false
                });
              }
            }
          }
        });
      };
      reader.readAsText(file);
    }
  }


  exportContacts(): void {
    // Crear los datos como un array de arrays (AOA)
    const aoa = [
      ['nombre', 'telefono'], // Encabezados
      ...this.contacts.map(contact => [contact.name, contact.phone])
    ];

    // Crear la hoja de cálculo
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Crear el libro y agregar la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');

    // Descargar el archivo
    XLSX.writeFile(workbook, 'contactos_whatsapp.xlsx');
  }




  clearAll(): void {
    if (confirm('¿Seguro que deseas eliminar todos los contactos?')) {
      this.contacts = [];
    }
  }

  sendViaWeb(contact: Contact): void {
    this.setHighlightedRow(contact.id as number);
    const phoneClean = contact.phone.replace(/\D/g, '');
    const message = this.messageTemplate.replace(/{nombre}/g, contact.name);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${phoneClean}&text=${encodedMessage}`;
    window.open(url, '_blank');
  }


  importExcel(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        jsonData.forEach((row, index) => {
          if (index === 0) return; // Saltar encabezado
          const [name, phone] = row;
          if (name && phone) {
            this.contacts.push({
              id: Date.now() + Math.random(),
              name: name.toString(),
              phone: phone.toString(),
              sent: false
            });
          }
        });
      };
      reader.readAsArrayBuffer(file);
    }
  }

  clearFile(): void {
    this.selectedFileName = '';
    const fileInput = document.getElementById('importFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  copyMessage(contact: any): void {
    this.setHighlightedRow(contact.id);
    const personalizedMessage = this.messageTemplate.replace(/{nombre}/gi, contact.name);

    navigator.clipboard.writeText(personalizedMessage).then(() => {
      this.showCopyNotification = true;

      // Oculta la notificación después de 2 segundos
      setTimeout(() => {
        this.showCopyNotification = false;
      }, 2000);

    }).catch(err => {
      console.error('Error al copiar el mensaje: ', err);
    });
  }

  // Método único para manejar el resaltado
  setHighlightedRow(contactId: number) {
    this.highlightedRowId = contactId;
  }


  saveTemplate() {
    // Guardar en localStorage cuando se pierde el foco
    if (this.messageTemplate) {
      localStorage.setItem('messageTemplate', this.messageTemplate);
    } else {
      localStorage.removeItem('messageTemplate');
    }
  }

  onTemplateChange(newTemplate: string) {
    // Actualizar el modelo y guardar
    this.messageTemplate = newTemplate;
    this.saveTemplate();
  }


}
