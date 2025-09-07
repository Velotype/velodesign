import {Button, ButtonThemeOptions} from "./button.tsx"
import type {ButtonAttrsType, ButtonType} from "./button.tsx"
import { Icon, I, registerIcon } from "./icon.ts"
import type {IAttrsType} from "./icon.ts"
import { licenses, addLicense } from "./license.ts"
import { Theme } from "./theme.ts"
import { History } from "./history.ts"
import { Link } from "./link.tsx"
import type { LinkAttrsType } from "./link.tsx"
import { PageSelector } from "./page-selector.tsx"
import type { Page, PageSelectorAttrsType } from "./page-selector.tsx"
import { TextBox } from "./textbox.tsx"
import type { TextBoxAttrsType } from "./textbox.tsx"
import { ButtonModal, type ButtonModalAttrsType, Modal, type ModalAttrsType, ModalThemeOptions } from "./modal.tsx"

export {
    Button,
    type ButtonType,
    type ButtonAttrsType,
    ButtonThemeOptions,

    Icon,
    type IAttrsType,
    I,
    registerIcon,

    TextBox,
    type TextBoxAttrsType,

    Modal,
    type ModalAttrsType,
    ModalThemeOptions,
    ButtonModal,
    type ButtonModalAttrsType,

    Link,
    type LinkAttrsType,

    Theme,
    History,

    type Page,
    type PageSelectorAttrsType,
    PageSelector,
    
    licenses,
    addLicense
}
