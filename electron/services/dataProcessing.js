class SheetDatabase {
  // private _sheetData: string[];
  // public state: { data: any[] };
  // public selectData: any[]
  // static lowChanceMode:boolean;
  constructor() {
    this._sheetData = [];
    // this.blockList=[]
    this.state = {
      data: [],
      // selectData:[],
      blockList: [],
      lowChanceMode: false,
      pointRuleList: [],
    };
  }

  set sheetData(e) {
    this._sheetData = e;
  }

  get sheetData() {
    return this._sheetData;
  }
}

module.exports = { SheetDatabase };
