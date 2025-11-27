import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================
// SUPER PARSER - VERSIÓN AVANZADA
// ============================================

interface ParseResult {
  fileName: string;
  fileId: string;
  make: string | null;
  model: string | null;
  year: string | null;
  system: string | null;
  docType: string | null;
  confidence: number;
  rawParts: string[];
}

interface ParsingStats {
  total: number;
  parsed: number;
  withMake: number;
  withModel: number;
  withYear: number;
  withSystem: number;
  withDocType: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

// Listas expandidas y mejoradas
const MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chevy',
  'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'GMC', 'Honda', 'Hyundai',
  'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
  'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'Mercedes-Benz', 'Mercedes', 'Benz',
  'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram', 'Renault',
  'Rolls-Royce', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'VW', 'Volvo'
];

const SYSTEMS = [
  'Motor', 'Engine', 'Combustion', 'Diesel', 'Gasolina', 'Fuel', 'Inyeccion',
  'Injection', 'Carburador', 'Carburetor', 'Turbo', 'Supercharger',
  'Transmision', 'Transmission', 'Gearbox', 'Clutch', 'Embrague', 'Diferencial',
  'Differential', 'Axle', 'Driveshaft', 'CVT', 'Automatica', 'Manual',
  'Electrico', 'Electric', 'Electrical', 'Wiring', 'Cableado', 'Alternador',
  'Alternator', 'Bateria', 'Battery', 'Starter', 'Arranque', 'Ignicion', 'Ignition',
  'Frenos', 'Brakes', 'ABS', 'Hidraulico', 'Hydraulic', 'Disco', 'Drum',
  'Suspension', 'Shock', 'Amortiguador', 'Spring', 'Resorte', 'Strut',
  'Direccion', 'Steering', 'Rack', 'Pinion', 'Power Steering',
  'AC', 'A/C', 'Aire Acondicionado', 'Air Conditioning', 'HVAC', 'Climatizacion',
  'Calefaccion', 'Heating',
  'Body', 'Carroceria', 'Chasis', 'Chassis', 'Frame', 'Panel',
  'Audio', 'Radio', 'Stereo', 'Speaker', 'Navigation', 'Display',
  'Airbag', 'SRS', 'Cinturon', 'Seatbelt', 'Alarm', 'Alarma'
];

const DOC_TYPES = [
  'Manual', 'Diagram', 'Diagrama', 'Esquema', 'Schematic', 'Wiring',
  'Service', 'Repair', 'Workshop', 'Taller', 'Maintenance', 'Mantenimiento',
  'Parts', 'Partes', 'Catalog', 'Catalogo', 'Owner', 'Propietario',
  'Technical', 'Tecnico', 'Specification', 'Especificacion'
];

class SuperParser {
  private stats: ParsingStats = {
    total: 0,
    parsed: 0,
    withMake: 0,
    withModel: 0,
    withYear: 0,
    withSystem: 0,
    withDocType: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0
  };

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractMake(parts: string[]): string | null {
    for (const part of parts) {
      const normalized = this.normalize(part);
      
      for (const make of MAKES) {
        if (normalized === make.toLowerCase()) {
          return make;
        }
      }
      
      for (const make of MAKES) {
        if (normalized.includes(make.toLowerCase())) {
          return make;
        }
      }
    }
    return null;
  }

  private extractYear(parts: string[]): string | null {
    for (const part of parts) {
      const rangeMatch = part.match(/(\d{2,4})[-_](\d{2,4})/);
      if (rangeMatch) {
        let year1 = rangeMatch[1];
        let year2 = rangeMatch[2];
        
        if (year1.length === 2) year1 = (parseInt(year1) > 50 ? '19' : '20') + year1;
        if (year2.length === 2) year2 = (parseInt(year2) > 50 ? '19' : '20') + year2;
        
        return `${year1}-${year2}`;
      }
      
      const singleMatch = part.match(/\b(19\d{2}|20[0-2]\d)\b/);
      if (singleMatch) {
        return singleMatch[1];
      }
      
      const shortMatch = part.match(/\b(\d{2})\b/);
      if (shortMatch) {
        const year = parseInt(shortMatch[1]);
        if (year >= 50 && year <= 99) {
          return `19${year}`;
        } else if (year >= 0 && year <= 30) {
          return `20${year}`;
        }
      }
    }
    return null;
  }

  private extractModel(parts: string[], make: string | null): string | null {
    if (!make) return null;
    
    const makeIndex = parts.findIndex(p => 
      this.normalize(p).includes(make.toLowerCase())
    );
    
    if (makeIndex === -1 || makeIndex === parts.length - 1) return null;
    
    const potentialModel = parts[makeIndex + 1];
    
    if (this.extractYear([potentialModel])) {
      if (makeIndex + 2 < parts.length) {
        return this.cleanModel(parts[makeIndex + 2]);
      }
      return null;
    }
    
    return this.cleanModel(potentialModel);
  }

  private cleanModel(model: string): string {
    return model
      .replace(/\.(pdf|PDF)$/, '')
      .replace(/[_-]/g, ' ')
      .trim();
  }

  private extractSystem(parts: string[]): string | null {
    const fullText = parts.join(' ').toLowerCase();
    
    for (const system of SYSTEMS) {
      if (fullText.includes(system.toLowerCase())) {
        return system;
      }
    }
    return null;
  }

  private extractDocType(parts: string[]): string | null {
    const fullText = parts.join(' ').toLowerCase();
    
    for (const docType of DOC_TYPES) {
      if (fullText.includes(docType.toLowerCase())) {
        return docType;
      }
    }
    return null;
  }

  private calculateConfidence(result: ParseResult): number {
    let score = 0;
    
    if (result.make) score += 30;
    if (result.model) score += 25;
    if (result.year) score += 20;
    if (result.system) score += 15;
    if (result.docType) score += 10;
    
    return score;
  }

  public parseFileName(fileName: string, fileId: string): ParseResult {
    const nameWithoutExt = (fileName || "").replace(/\.pdf$/i, '');
    const parts = nameWithoutExt.split(/[-_\s]+/);
    
    const make = this.extractMake(parts);
    const year = this.extractYear(parts);
    const model = this.extractModel(parts, make);
    const system = this.extractSystem(parts);
    const docType = this.extractDocType(parts);
    
    const result: ParseResult = {
      fileName,
      fileId,
      make,
      model,
      year,
      system,
      docType,
      confidence: 0,
      rawParts: parts
    };
    
    result.confidence = this.calculateConfidence(result);
    
    return result;
  }

  private updateStats(result: ParseResult): void {
    this.stats.total++;
    
    if (result.make || result.model || result.year) {
      this.stats.parsed++;
    }
    
    if (result.make) this.stats.withMake++;
    if (result.model) this.stats.withModel++;
    if (result.year) this.stats.withYear++;
    if (result.system) this.stats.withSystem++;
    if (result.docType) this.stats.withDocType++;
    
    if (result.confidence >= 70) this.stats.highConfidence++;
    else if (result.confidence >= 40) this.stats.mediumConfidence++;
    else this.stats.lowConfidence++;
  }

  public async processDatabase(dryRun: boolean = false): Promise<void> {
    console.log('🚀 SUPER PARSER - Iniciando...\n');
    
    const diagrams = await pool.query(
      'SELECT id, "file_name", "file_id" FROM diagrams ORDER BY "file_name"'
    );
    
    console.log(`📊 Total de diagramas: ${diagrams.rows.length}\n`);
    
    const results: ParseResult[] = [];
    const updates: any[] = [];
    
    for (const diagram of diagrams.rows) {
      const result = this.parseFileName(diagram.fileName, diagram.fileId);
      results.push(result);
      this.updateStats(result);
      
      if (!dryRun && (result.make || result.model || result.year || result.system || result.docType)) {
        updates.push({
          id: diagram.id,
          make: result.make,
          model: result.model,
          year: result.year,
          system: result.system,
          docType: result.docType
        });
      }
    }
    
    if (!dryRun && updates.length > 0) {
      console.log(`\n💾 Actualizando ${updates.length} diagramas...`);
      
      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        await pool.query(
          `UPDATE diagrams 
           SET make = $1, model = $2, year = $3, system = $4, "doc_type" = $5
           WHERE id = $6`,
          [update.make, update.model, update.year, update.system, update.docType, update.id]
        );
        
        if ((i + 1) % 1000 === 0) {
          console.log(`  Procesados: ${i + 1}/${updates.length}`);
        }
      }
      
      console.log('✅ Actualización completada');
    }
    
    this.printStats();
    this.generateReport(results);
    
    await pool.end();
  }

  private printStats(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ESTADÍSTICAS DE PARSING');
    console.log('='.repeat(60));
    console.log(`Total de diagramas:        ${this.stats.total}`);
    console.log(`Parseados exitosamente:    ${this.stats.parsed} (${(this.stats.parsed/this.stats.total*100).toFixed(1)}%)`);
    console.log(`Con marca:                 ${this.stats.withMake} (${(this.stats.withMake/this.stats.total*100).toFixed(1)}%)`);
    console.log(`Con modelo:                ${this.stats.withModel} (${(this.stats.withModel/this.stats.total*100).toFixed(1)}%)`);
    console.log(`Con año:                   ${this.stats.withYear} (${(this.stats.withYear/this.stats.total*100).toFixed(1)}%)`);
    console.log(`Con sistema:               ${this.stats.withSystem} (${(this.stats.withSystem/this.stats.total*100).toFixed(1)}%)`);
    console.log(`Con tipo de documento:     ${this.stats.withDocType} (${(this.stats.withDocType/this.stats.total*100).toFixed(1)}%)`);
    console.log('\n📈 CONFIANZA:');
    console.log(`Alta (70%+):               ${this.stats.highConfidence}`);
    console.log(`Media (40-69%):            ${this.stats.mediumConfidence}`);
    console.log(`Baja (<40%):               ${this.stats.lowConfidence}`);
    console.log('='.repeat(60) + '\n');
  }

  private generateReport(results: ParseResult[]): void {
    const reportPath = path.join(process.cwd(), 'parsing-report.json');
    
    const topResults = results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50);
    
    const worstResults = results
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 50);
    
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      topResults,
      worstResults
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado en: ${reportPath}\n`);
  }
}

const main = async () => {
  const dryRun = process.argv.includes('--dry-run');
  
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - No se actualizará la base de datos\n');
  }
  
  const parser = new SuperParser();
  await parser.processDatabase(dryRun);
  
  process.exit(0);
};

main().catch(console.error);
