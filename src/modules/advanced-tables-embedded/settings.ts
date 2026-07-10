import {
  FormatType,
  Options,
  optionsWithDefaults,
} from '@tgrosinger/md-advanced-tables';

export const defaultSettings: Partial<ISettings> = {
  formatType: FormatType.WEAK,
  showRibbonIcon: true,
  bindEnter: true,
  bindTab: true,
  showFloatingControls: true,
  showColorBlocks: true,
  showZebraStripes: false,
};

export interface ISettings {
  formatType: FormatType;
  showRibbonIcon: boolean;
  bindEnter: boolean;
  bindTab: boolean;
  showFloatingControls: boolean;
  showColorBlocks: boolean;
  showZebraStripes: boolean;
}

export class TableEditorPluginSettings implements ISettings {
  public formatType: FormatType;
  public showRibbonIcon: boolean;

  public bindEnter: boolean;
  public bindTab: boolean;
  public showFloatingControls: boolean;
  public showColorBlocks: boolean;
  public showZebraStripes: boolean;

  constructor(loadedData: Partial<ISettings>) {
    const allFields = { ...defaultSettings, ...loadedData };
    this.formatType = allFields.formatType;
    this.showRibbonIcon = allFields.showRibbonIcon;
    this.bindEnter = allFields.bindEnter;
    this.bindTab = allFields.bindTab;
    this.showFloatingControls = allFields.showFloatingControls;
    this.showColorBlocks = allFields.showColorBlocks;
    this.showZebraStripes = allFields.showZebraStripes;
  }

  public asOptions(): Options {
    return optionsWithDefaults({ formatType: this.formatType });
  }
}

export type AdvancedTablesEmbeddedSettingsData = Partial<ISettings>;
