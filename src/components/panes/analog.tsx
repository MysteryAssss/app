/* src/components/panes/analog.tsx*/
import React, {useState, useEffect} from 'react';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import ChippyLoader from '../chippy-loader';
import LoadingText from '../loading-text';
import {CenterPane, ConfigureBasePane, AnalogBasePane} from './pane';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  CustomFeaturesV2,
  getLightingDefinition,
  isVIADefinitionV2,
  isVIADefinitionV3,
  VIADefinitionV2,
  VIADefinitionV3,
} from '@the-via/reader';
import * as Keycode from './configure-panes/keycode';
import * as Lighting from './configure-panes/lighting';
import * as Macros from './configure-panes/macros';
import * as SaveLoad from './configure-panes/save-load';
import * as Layouts from './configure-panes/layouts';
import * as RotaryEncoder from './configure-panes/custom/satisfaction75';
import {Grid, Row, IconContainer, MenuCell, AnalogFlexCell} from './grid';
import {makeCustomMenus} from './configure-panes/custom/menu-generator';
import {LayerControl} from './configure-panes/layer-control';
import {Badge} from './configure-panes/badge';
import {AccentButtonLarge} from '../inputs/accent-button';
import {useAppSelector} from 'src/store/hooks';
import {getSelectedDefinition} from 'src/store/definitionsSlice';
import {
  clearSelectedKeys,
  getLoadProgress,
  getNumberOfLayers,
  setAnalogKeyboardIsSelectable,
} from 'src/store/analogKeymapSlice';
import {useDispatch} from 'react-redux';
import {reloadConnectedDevices} from 'src/store/devicesThunks';
import {getV3MenuComponents} from 'src/store/menusSlice';
import {getIsMacroFeatureSupported} from 'src/store/macrosSlice';
import {getConnectedDevices, getSupportedIds} from 'src/store/devicesSlice';
import {isElectron} from 'src/utils/running-context';
import {useAppDispatch} from 'src/store/hooks';
import {MenuTooltip} from '../inputs/tooltip';
import {getRenderMode, getSelectedTheme} from 'src/store/settingsSlice';

const MenuContainer = styled.div`
  padding: 15px 10px 20px 10px;
`;

const Rows = [
    Keycode, //eyey
    Layouts,//yeet
    Lighting,//yeet
    SaveLoad,//yeet
    RotaryEncoder,//yeet
    ...makeCustomMenus([]),//keep?
  ];
  function getCustomPanes(customFeatures: CustomFeaturesV2[]) {
    if (
      customFeatures.find((feature) => feature === CustomFeaturesV2.RotaryEncoder)
    ) {
      return [RotaryEncoder];
    }
    return [];
  }
  
  
const getRowsForKeyboard = (): typeof Rows => { // => getAnalogRowsForKeyboard
    const showMacros = useAppSelector(getIsMacroFeatureSupported); //yeet
    const v3Menus = useAppSelector(getV3MenuComponents);
    const selectedDefinition = useAppSelector(getSelectedDefinition);
    const numberOfLayers = useAppSelector(getNumberOfLayers); //yeet
  
    if (!selectedDefinition) {
      return [];
    } else if (isVIADefinitionV2(selectedDefinition)) {
      return getRowsForKeyboardV2(selectedDefinition, showMacros, numberOfLayers);
    } else if (isVIADefinitionV3(selectedDefinition)) {
      return [
        ...filterInferredRows(selectedDefinition, showMacros, numberOfLayers, [
          Keycode,
          Layouts,
          SaveLoad,
        ]),
        ...v3Menus,
      ];
    } else {
      return [];
    }
  };

  const filterInferredRows = (
    selectedDefinition: VIADefinitionV3 | VIADefinitionV2,
    showMacros: boolean,
    numberOfLayers: number,
    rows: typeof Rows,
  ): typeof Rows => {
    const {layouts} = selectedDefinition;
    let removeList: typeof Rows = [];
    // LAYOUTS IS INFERRED, filter out if doesn't exist
    if (
      !(layouts.optionKeys && Object.entries(layouts.optionKeys).length !== 0)
    ) {
      removeList = [...removeList, Layouts];
    }
  
    if (numberOfLayers === 0) {
      removeList = [...removeList, Keycode, SaveLoad];
    }
    let filteredRows = rows.filter(
      (row) => !removeList.includes(row),
    ) as typeof Rows;
    return filteredRows;
  };
  

  const getRowsForKeyboardV2 = (
    selectedDefinition: VIADefinitionV2,
    showMacros: boolean,
    numberOfLayers: number,
  ): typeof Rows => {
    let rows: typeof Rows = [Keycode, Layouts, SaveLoad];
    if (isVIADefinitionV2(selectedDefinition)) {
      const {lighting, customFeatures} = selectedDefinition;
      const {supportedLightingValues} = getLightingDefinition(lighting);
      if (supportedLightingValues.length !== 0) {
        rows = [...rows, Lighting];
      }
      if (customFeatures) {
        rows = [...rows, ...getCustomPanes(customFeatures)];
      }
    }
    return filterInferredRows(
      selectedDefinition,
      showMacros,
      numberOfLayers,
      rows,
    );
  };
  
const Loader: React.FC<{
    loadProgress: number;
    selectedDefinition: VIADefinitionV2 | VIADefinitionV3 | null;
  }> = (props) => {
    const {loadProgress, selectedDefinition} = props;
    const dispatch = useAppDispatch();
    const theme = useAppSelector(getSelectedTheme);
  
    const connectedDevices = useAppSelector(getConnectedDevices);
    const supportedIds = useAppSelector(getSupportedIds);
    const noSupportedIds = !Object.values(supportedIds).length;
    const noConnectedDevices = !Object.values(connectedDevices).length;
    const [showButton, setShowButton] = useState<boolean>(false);
  
    useEffect(() => {
      const timeout = setTimeout(() => {
        if (!selectedDefinition) {
          setShowButton(true);
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }, [selectedDefinition]);
    return (
      <LoaderPane>
        {<ChippyLoader theme={theme} progress={loadProgress || null} />}
        {(showButton || noConnectedDevices) && !noSupportedIds && !isElectron ? (
          <AccentButtonLarge onClick={() => dispatch(reloadConnectedDevices())}>
            Authorize device
            <FontAwesomeIcon style={{marginLeft: '10px'}} icon={faPlus} />
          </AccentButtonLarge>
        ) : (
          <LoadingText isSearching={!selectedDefinition} />
        )}
      </LoaderPane>
    );
  };
  


  const LoaderPane = styled(CenterPane)`
  display: flex;
  align-items: center;
  justify-content: center;
  row-gap: 50px;
  position: absolute;
  bottom: 50px;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 4;
`;

export const AnalogPane = () => {
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const loadProgress = useAppSelector(getLoadProgress);
  const renderMode = useAppSelector(getRenderMode);

  const showLoader = !selectedDefinition || loadProgress !== 1;
  return showLoader ? (
    renderMode === '2D' ? (
      <Loader
        selectedDefinition={selectedDefinition || null}
        loadProgress={loadProgress}
      />
    ) : null
  ) : (
/*bottom bar for sliders etc */
    <AnalogBasePane>
      <AnalogGrid />
    </AnalogBasePane>
  );
};

const AnalogGrid = () => {
    const dispatch = useDispatch();
  
    const [selectedRow, setRow] = useState(0);
    const KeyboardRows = getRowsForKeyboard(); // => getAnalogRowsForKeyboard
    const SelectedPane = KeyboardRows[selectedRow]?.Pane;
    const selectedTitle = KeyboardRows[selectedRow]?.Title;
  
    useEffect(() => {
      if (selectedTitle !== 'Keymap') {
        dispatch(setAnalogKeyboardIsSelectable(false));
      } else {
        dispatch(setAnalogKeyboardIsSelectable(true));
      }
    }, [selectedTitle]);
  
    return (
      <>
        <Grid style={{pointerEvents: 'none'}}>
          <MenuCell style={{pointerEvents: 'all'}}>
            <MenuContainer>
              {(KeyboardRows || []).map(
                ({Icon, Title}: {Icon: any; Title: string}, idx: number) => (
                  <Row
                    key={idx}
                    onClick={(_) => setRow(idx)}
                    $selected={selectedRow === idx}
                  >
                    <IconContainer>
                      <Icon />
                      <MenuTooltip>{Title}</MenuTooltip>
                    </IconContainer>
                  </Row>
                ),
              )}
            </MenuContainer>
          </MenuCell>
  
          {SelectedPane && <SelectedPane />}
        </Grid>
      </>
    );
  };
  