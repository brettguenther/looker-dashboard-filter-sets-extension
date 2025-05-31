// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useState, useContext } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  ComponentsProvider,
  Divider,
  InputText,
  Heading,
  Paragraph,
  Space,
  SpaceVertical,
} from '@looker/components'
import { getCore40SDK, ExtensionContext40 } from '@looker/extension-sdk-react'

export const DashboardFilterSets = () => {
  const coreSDK = getCore40SDK()
  const { tileHostData, tileSDK } = useContext(ExtensionContext40)
  const dashboardFilters = tileHostData?.dashboardFilters

  const [currentFilters, setCurrentFilters] = useState({})
  const [savedFilterSets, setSavedFilterSets] = useState([]);
  const [newFilterSetName, setNewFilterSetName] = useState('');

  const ARTIFACT_NAMESPACE = 'dashboardFilterSetsApp';
  const ARTIFACT_KEY = 'userSavedFilterSets';

  useEffect(() => {
    setCurrentFilters(dashboardFilters || {});
  }, [dashboardFilters]);

  useEffect(() => {
    const loadSavedSets = async () => {
      console.log("loading sets")
      try {
        const artifactValue = await coreSDK.ok(coreSDK.artifact_value(ARTIFACT_NAMESPACE,ARTIFACT_KEY));
        console.log("artifactValue", JSON.stringify(artifactValue))
        if (artifactValue) {
          try {
            setSavedFilterSets(Array.isArray(artifactValue) ? artifactValue : []);
          } catch (err) {
            console.error('Failed to save filter sets:', err);
            setSavedFilterSets([]);
          }
        } else {
          setSavedFilterSets([]);
        }
      } catch (error) {
        console.log('No saved filter sets found or failed to load:', error.message);
        setSavedFilterSets([]);
      }
    };
    loadSavedSets();
  }, [coreSDK]); 

  const handleSaveCurrentFilterSet = async () => {
    const trimmedName = newFilterSetName.trim();
    if (!trimmedName) {
      return;
    }

    const newSet = {
      id: Date.now().toString(),
      name: trimmedName,
      filters: { ...currentFilters },
    };

    const currentArtifact = await coreSDK.ok(coreSDK.artifact({namespace: ARTIFACT_NAMESPACE,key: ARTIFACT_KEY}))

    const updatedSets = [...savedFilterSets, newSet];

    try {
      await coreSDK.ok(coreSDK.update_artifacts(
        ARTIFACT_NAMESPACE,
        [{
          key: ARTIFACT_KEY,
          value: JSON.stringify(updatedSets),
          content_type: 'application/json',
          version: currentArtifact?.[0].version
        }]
      ));
      setSavedFilterSets(updatedSets);
      setNewFilterSetName(''); 
    } catch (error) {
      console.error('Failed to save filter set to artifact:', error);
    }
  };

  const handleDeleteFilterSet = async (setIdToDelete) => {
    const updatedSets = savedFilterSets.filter(set => set.id !== setIdToDelete);

    try {
      const currentArtifact = await coreSDK.ok(coreSDK.artifact({namespace: ARTIFACT_NAMESPACE, key: ARTIFACT_KEY}));
      const version = currentArtifact?.[0]?.version;

      if (version === undefined && updatedSets.length > 0) {
        console.warn('Attempting to update artifact without a version. This might lead to issues if the artifact exists.');
      }

      await coreSDK.ok(coreSDK.update_artifacts(
        ARTIFACT_NAMESPACE,
        [{ key: ARTIFACT_KEY, value: JSON.stringify(updatedSets), content_type: 'application/json', version: version }]
      ));
      setSavedFilterSets(updatedSets);
    } catch (error) {
      console.error('Failed to delete filter set from artifact:', error);
    }
  };
  const handleApplyFilterSet = (filtersToApply) => {
    if (tileSDK) {
      tileSDK.updateFilters(filtersToApply, true); // true to run filters immediately
    } else {
      console.error("tileSDK is not available to apply filters.");
    }
  };

  return (
    <ComponentsProvider>
      <Box p="large">
        {/* <Heading as="h2" mb="medium">Current Dashboard Filters</Heading>
        {Object.keys(currentFilters).length > 0 ? (
          <Fieldset>
            {Object.entries(currentFilters).map(([name, value], index) => (
              <Paragraph key={index}>
                <strong>{name}:</strong> {value}
              </Paragraph>
            ))}
          </Fieldset>
        ) : (
          <Paragraph>No filters currently applied on the dashboard.</Paragraph>
        )} */}
        <InputText
            id="new-filter-set-name"
            label="Filter Set Name"
            onChange={(e)=>setNewFilterSetName(e.target.value)}
            placeholder="Filter Set Name"></InputText>
        <Button size="small" onClick={handleSaveCurrentFilterSet} disabled={Object.keys(currentFilters).length === 0 || newFilterSetName.trim() === ''}>Save Current Filter Set</Button>
        <Divider my="xlarge" />
        <Heading as="h5" mb="medium">Saved Filter Sets</Heading>
        {savedFilterSets.length > 0 ? (
          savedFilterSets.map((set) => (
            <Card key={set.id} my="medium">
              <CardContent>
                <Heading as="h6" fontWeight="semiBold">{set.name}</Heading>
                <SpaceVertical mt="small" gap="xxsmall">
                  {Object.entries(set.filters).map(([name, value], index) => (
                    <Space key={index} between>
                      <Paragraph fontSize="small" color="text2">
                        {name}:
                      </Paragraph>
                      <Paragraph fontSize="small" fontWeight="medium" truncate>{value}</Paragraph>
                    </Space>
                  ))}
                </SpaceVertical>
                <Space mt="medium" reverse>
                  <Button color="critical" size="small" onClick={() => handleDeleteFilterSet(set.id)}>Delete</Button>
                  <Button size="small" onClick={() => handleApplyFilterSet(set.filters)}>Apply</Button>
                </Space>
              </CardContent>
            </Card>
          ))
        ) : (
          <Paragraph>You have no saved filter sets.</Paragraph>
        )}
      </Box>
    </ComponentsProvider>
  )
}
