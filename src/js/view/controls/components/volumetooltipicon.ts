import TooltipIcon from 'view/controls/components/tooltipicon';
import Slider from 'view/controls/components/slider';
import UI from 'utils/ui';
import { setAttribute, toggleClass } from 'utils/dom';
import type Model from 'controller/model';

class VolumeSlider extends Slider {
    uiOver: UI;

    constructor(orientation: string, label: string, styleElement: HTMLElement) {
        let className = 'jw-slider-volume';
        if (orientation === 'vertical') {
            className += ' jw-volume-tip';
        }
        super(className, orientation);
        this.setup();

        this.element().classList.remove('jw-background-color');

        setAttribute(styleElement, 'tabindex', '0');
        setAttribute(styleElement, 'aria-label', label);
        setAttribute(styleElement, 'aria-orientation', orientation);
        setAttribute(styleElement, 'aria-valuemin', 0);
        setAttribute(styleElement, 'aria-valuemax', 100);
        setAttribute(styleElement, 'role', 'slider');

        this.uiOver = new UI(styleElement)
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .on('click', function(): void {});
    }
}

export default class VolumeTooltipIcon extends TooltipIcon {
    _model: Model;
    horizontalContainer: HTMLElement;
    horizontalSlider: VolumeSlider;
    verticalSlider: VolumeSlider;
    ui: UI;

    constructor(_model: Model, name: string, ariaText: string, svgIcons: Node[], horizontalContainer: HTMLElement) {
        super(name, ariaText, true, svgIcons);

        this._model = _model;
        this.horizontalContainer = horizontalContainer;

        const volumeLabel = _model.get('localization').volumeSlider;
        this.horizontalSlider = new VolumeSlider('horizontal', volumeLabel, horizontalContainer);
        this.verticalSlider = new VolumeSlider('vertical', volumeLabel, this.tooltip);

        horizontalContainer.appendChild(this.horizontalSlider.element());
        this.addContent(this.verticalSlider.element());

        this.verticalSlider.on('update', function (this: VolumeTooltipIcon, evt: Event): void {
            this.trigger('update', evt);
        }, this);

        this.horizontalSlider.on('update', function (this: VolumeTooltipIcon, evt: Event): void {
            this.trigger('update', evt);
        }, this);

        this.horizontalSlider.uiOver.on('keydown', (evt) => {
            const event = evt.sourceEvent;
            switch (event.keyCode) {
                case 37:
                    event.stopPropagation();
                    this.trigger('adjustVolume', -10);
                    break;
                case 39:
                    event.stopPropagation();
                    this.trigger('adjustVolume', 10);
                    break;
                default:
            }
        });

        this.ui = new UI(this.el, { directSelect: true })
            .on('click enter', this.toggleValue, this)
            .on('tap', this.toggleOpenState, this);

        this.addSliderHandlers(this.ui);
        this.addSliderHandlers(this.horizontalSlider.uiOver);
        this.addSliderHandlers(this.verticalSlider.uiOver);

        this.onAudioMode(null, _model.get('audioMode'));

        this._model.on('change:audioMode', this.onAudioMode, this);
    }

    onAudioMode(model: Model | null, val: boolean): void {
        const tabIndex = val ? 0 : -1;
        setAttribute(this.horizontalContainer, 'tabindex', tabIndex);
    }

    addSliderHandlers(ui: UI): void {
        const { openSlider, closeSlider } = this;
        ui.on('over', openSlider, this)
            .on('out', closeSlider, this)
            .on('focus', openSlider, this)
            .on('blur', closeSlider, this);
    }

    openSlider(evt: Event): void {
        super.openTooltip(evt);
        toggleClass(this.horizontalContainer, this.openClass, true);
    }

    closeSlider(evt: Event): void {
        super.closeTooltip(evt);
        toggleClass(this.horizontalContainer, this.openClass, false);
        this.horizontalContainer.blur();
    }

    toggleValue(): void {
        this.trigger('toggleValue');
    }

    destroy(): void {
        this.horizontalSlider.uiOver.destroy();
        this.verticalSlider.uiOver.destroy();
        this.ui.destroy();
    }
}
