import { LitElement, html, css } from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module=true';

export class PPlayer extends LitElement {
  static get properties() {
    return {
      calibrated: { type: Boolean },
      player: { type: Object },
      size: { type: Number }
    };
  }
  firstUpdated() {
    this.min = 0;
    this.max = 0;
    this.calibrated = false;
  }
  async play(e) {
    if(!this.goDirect) {
      const { default: godirect } = await import("https://unpkg.com/@vernier/godirect@1.5.4/dist/godirect.min.esm.js");
      this.goDirect = godirect;
    }
    try {
      const device = await this.goDirect.selectDevice();
      this.player = device.sensors.filter(s => s.name === "Force")[0];
    } catch(err) {
      alert(err.message);
    }
    this.player.on('value-changed', (sensor) => {
      this.force = !this.calibrated ? this.player.value : 
        this.player.value > this.size*0.95 ? this.size*0.95 : 
        this.player.value < 0 ? 0 : this.player.value;
      if(this.calibrated) return;
      this.min = this.force < this.min ? this.force : this.min;
      this.max = this.force > this.max ? this.force : this.max;
      this.size = this.max + Math.abs(this.min);
      setTimeout(_ => { 
        this.calibrated=true;
        requestAnimationFrame(_ => {
          this.canvas = this.shadowRoot.querySelector('#game');
          this.context = this.canvas.getContext('2d');
          this.draw();
        });
      }, 3000);
    });
  }
  draw() {
    this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.context.fillStyle = '#000';
    this.context.fillRect(this.size/10,this.canvas.height - this.size/20 - this.force,this.size/20,this.size/20);

    requestAnimationFrame(_ => this.draw());
  }
  render() {
    if(!this.player) return html`<button id='play' @click=${this.play}>PLAY</button>`;
    if(!this.calibrated) return html`<div id='calibration'>Give the sensor a good one handed squeeze.</div>`;
    return html`<canvas height=${this.size} width=${this.size} id='game'></canvas>`;
  }
  static styles = css`
    * { box-sizing: border-box }
    :host {
      display:flex;
      align-items:center;
      justify-content:center;
    }
    #play {
      background-color:red;
      height:8em;
      width:8em;
      border-radius:50%;
      border: 4px solid darkred;
      color:white;
    }
    #calibration {
      background-color:green;
      border: 4px solid darkgreen;
      color:white;
      border-radius:8px;
      padding:2em;
      font-size:24px;
    }
    #game {
      width: 90vmin;
      border: 1px solid black;
    }
  `;
}
customElements.define('p-player', PPlayer);